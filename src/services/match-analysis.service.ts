import { Service, Inject } from 'typedi';
import { Repository } from 'typeorm';
import {
  ReplayNotFoundError,
  ReplayPrivateError,
  ReplayTimeoutError,
  ReplayUpstreamError,
  ReplayParseError,
  ValidationError,
} from '../errors';
import {
  MatchPreviewDto,
  PlayerPreviewDto,
  PreviewErrorCode,
  PreviewErrorDto,
} from '../dtos/match-analysis.dto';
import { Season } from '../entities/season.entity';
import { User } from '../entities/user.entity';
import { Team } from '../entities/team.entity';
import { Match } from '../entities/match.entity';
import { SeasonPokemon } from '../entities/season-pokemon.entity';
import { ReplayFetcherService, ShowdownReplayJson } from './replay-fetcher.service';
import { ReplayParserService } from './replay-parser.service';
import { ReplayAnalysis } from '../utils/replay-parser/types';
import { toID } from '../utils/showdown-id.utils';

// ---------------------------------------------------------------------------
// Internal types used within the pipeline
// ---------------------------------------------------------------------------

interface ParsedReplay {
  url: string;
  index: number;
  json: ShowdownReplayJson;
  analysis: ReplayAnalysis;
}

interface ResolvedPlayer {
  rawShowdownName: string;
  user: User | null;
  team: Team | null;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Service()
export class MatchAnalysisService {
  constructor(
    @Inject('SeasonRepository') private seasonRepo: Repository<Season>,
    @Inject('UserRepository') private userRepo: Repository<User>,
    @Inject('TeamRepository') private teamRepo: Repository<Team>,
    @Inject('MatchRepository') private matchRepo: Repository<Match>,
    @Inject('SeasonPokemonRepository') private seasonPokemonRepo: Repository<SeasonPokemon>,
    @Inject() private fetcherService: ReplayFetcherService,
    @Inject() private parserService: ReplayParserService,
  ) {}

  /**
   * Stateless analysis pipeline — stages 1-4.
   * Stage 5 (Pokémon resolution + stat/winner computation) is implemented in 03-02.
   *
   * NEVER writes to the database (ANLZ-10).
   */
  async analyze(seasonId: number, replayUrls: string[]): Promise<MatchPreviewDto> {
    const errors: PreviewErrorDto[] = [];

    const pushError = (
      field: string,
      code: PreviewErrorCode,
      message: string,
      candidates?: unknown[],
    ): void => {
      const err = new PreviewErrorDto();
      err.field = field;
      err.code = code;
      err.message = message;
      if (candidates !== undefined) {
        err.candidates = candidates;
      }
      errors.push(err);
    };

    // Load season (raw repo, no throw)
    const season = await this.seasonRepo.findOne({ where: { id: seasonId } });
    const numberOfGames = season?.numberOfGames ?? 3;

    // STAGE 1: Fetch and parse each replay URL
    const parsed = await this.fetchAndParse(replayUrls, errors);

    // STAGE 2: Validate set (count + player consistency)
    const canonicalPair = this.validateSet(parsed, numberOfGames, replayUrls, errors, pushError);

    // Derive the two canonical player names from the first successful replay
    const twoPlayerNames: [string, string] = canonicalPair ?? ['', ''];

    // STAGE 3 & 4: Resolve players to users/teams, then look up the match
    const { players, matchPreview } = await this.resolvePlayersAndMatch(
      seasonId,
      twoPlayerNames,
      parsed,
      errors,
      pushError,
    );

    // Build the result DTO
    const preview = new MatchPreviewDto();
    preview.seasonId = seasonId;
    preview.replayUrls = replayUrls;
    preview.matchId = matchPreview.matchId;
    preview.weekId = matchPreview.weekId;
    preview.weekName = matchPreview.weekName;
    preview.players = players;
    preview.games = []; // populated in 03-02
    preview.matchWinnerTeamId = null; // populated in 03-02
    preview.matchLoserTeamId = null; // populated in 03-02
    preview.isDecisive = false; // populated in 03-02
    preview.errors = errors;

    // STAGE 5 (Pokémon + stats + winners) — implemented in 03-02
    return preview;
  }

  // ---------------------------------------------------------------------------
  // Stage 1: fetch and parse
  // ---------------------------------------------------------------------------

  private async fetchAndParse(
    replayUrls: string[],
    errors: PreviewErrorDto[],
  ): Promise<ParsedReplay[]> {
    const seenUrls = new Set<string>();
    const results: ParsedReplay[] = [];

    for (let i = 0; i < replayUrls.length; i++) {
      const url = replayUrls[i];

      // Duplicate detection (ERR-07)
      if (seenUrls.has(url)) {
        const err = new PreviewErrorDto();
        err.field = `replays[${i}]`;
        err.code = PreviewErrorCode.REPLAY_DUPLICATE;
        err.message = `Duplicate replay URL: ${url}`;
        errors.push(err);
        continue;
      }
      seenUrls.add(url);

      try {
        const json = await this.fetcherService.fetchReplay(url);
        const analysis = await this.parserService.parse(json.id, json.log);
        results.push({ url, index: i, json, analysis });
      } catch (err) {
        const code = this.mapFetchError(err);
        const message = err instanceof Error ? err.message : String(err);
        const errorDto = new PreviewErrorDto();
        errorDto.field = `replays[${i}]`;
        errorDto.code = code;
        errorDto.message = message;
        errors.push(errorDto);
      }
    }

    return results;
  }

  private mapFetchError(err: unknown): PreviewErrorCode {
    if (err instanceof ReplayNotFoundError) return PreviewErrorCode.REPLAY_NOT_FOUND;
    if (err instanceof ReplayPrivateError) return PreviewErrorCode.REPLAY_PRIVATE;
    if (err instanceof ReplayTimeoutError) return PreviewErrorCode.REPLAY_TIMEOUT;
    if (err instanceof ReplayUpstreamError) return PreviewErrorCode.REPLAY_UPSTREAM;
    if (err instanceof ReplayParseError) return PreviewErrorCode.REPLAY_PARSE;
    if (err instanceof ValidationError) return PreviewErrorCode.REPLAY_NOT_FOUND;
    return PreviewErrorCode.REPLAY_UPSTREAM;
  }

  // ---------------------------------------------------------------------------
  // Stage 2: set validation (count + player consistency)
  // ---------------------------------------------------------------------------

  private validateSet(
    parsed: ParsedReplay[],
    numberOfGames: number,
    replayUrls: string[],
    errors: PreviewErrorDto[],
    pushError: (field: string, code: PreviewErrorCode, message: string, candidates?: unknown[]) => void,
  ): [string, string] | null {
    const parsedCount = parsed.length;
    const minCount = Math.ceil(numberOfGames / 2);
    const maxCount = numberOfGames;

    // Count validation (ANLZ-01)
    if (parsedCount < minCount || parsedCount > maxCount) {
      pushError(
        'set',
        PreviewErrorCode.COUNT_OUT_OF_RANGE,
        `Expected ${minCount}–${maxCount} replays for a Bo${numberOfGames}, got ${parsedCount} valid replay(s).`,
      );
    }

    if (parsed.length === 0) {
      return null;
    }

    // Player consistency (ERR-06): all replays must have the same unordered pair of players
    const canonical = this.normalizedPair(parsed[0].analysis.playerNames);
    let consistent = true;

    for (let i = 1; i < parsed.length; i++) {
      const pair = this.normalizedPair(parsed[i].analysis.playerNames);
      if (pair[0] !== canonical[0] || pair[1] !== canonical[1]) {
        consistent = false;
        break;
      }
    }

    if (!consistent) {
      pushError(
        'set',
        PreviewErrorCode.PLAYERS_INCONSISTENT,
        'Player names differ across replays in this set.',
      );
    }

    return [parsed[0].analysis.playerNames[0], parsed[0].analysis.playerNames[1]];
  }

  /** Returns a sorted tuple of toID-normalized player names. */
  private normalizedPair(playerNames: string[]): [string, string] {
    const ids = playerNames.map(toID).sort() as [string, string];
    return ids;
  }

  // ---------------------------------------------------------------------------
  // Stages 3 & 4: user/team resolution + match lookup
  // ---------------------------------------------------------------------------

  private async resolvePlayersAndMatch(
    seasonId: number,
    twoPlayerNames: [string, string],
    parsed: ParsedReplay[],
    errors: PreviewErrorDto[],
    pushError: (field: string, code: PreviewErrorCode, message: string, candidates?: unknown[]) => void,
  ): Promise<{
    players: PlayerPreviewDto[];
    matchPreview: { matchId: number | null; weekId: number | null; weekName: string | null };
  }> {
    // Load season roster once: all teams for this season with their users
    const seasonTeams: Team[] = await this.teamRepo.find({
      where: { seasonId },
      relations: { user: true },
    });

    // Stage 3: resolve each player name to a User via toID normalization
    const resolved = this.resolvePlayers(twoPlayerNames, seasonTeams, errors, pushError);

    // Stage 4: map each resolved user to their team + find the match
    const players = this.buildPlayerDtos(resolved, seasonTeams);
    const matchPreview = await this.resolveTeamsAndMatch(seasonId, resolved, players, errors, pushError);

    return { players, matchPreview };
  }

  private resolvePlayers(
    twoPlayerNames: [string, string],
    seasonTeams: Team[],
    errors: PreviewErrorDto[],
    pushError: (field: string, code: PreviewErrorCode, message: string, candidates?: unknown[]) => void,
  ): ResolvedPlayer[] {
    const resolved: ResolvedPlayer[] = [];
    const usedUserIds = new Set<number>();

    for (let i = 0; i < 2; i++) {
      const rawName = twoPlayerNames[i];
      const normalizedName = toID(rawName);

      const match = seasonTeams.find(
        (t) => t.user && toID(t.user.showdownUsername ?? '') === normalizedName && !usedUserIds.has(t.user.id),
      );

      if (match?.user) {
        usedUserIds.add(match.user.id);
        resolved.push({ rawShowdownName: rawName, user: match.user, team: match });
      } else {
        // Candidates: all roster users excluding already-matched ones
        const candidates = seasonTeams
          .filter((t) => t.user && !usedUserIds.has(t.user.id))
          .map((t) => ({
            userId: t.user.id,
            name: [t.user.firstName, t.user.lastName].filter(Boolean).join(' '),
            showdownUsername: t.user.showdownUsername,
          }));

        pushError(
          `players[${i}].user`,
          PreviewErrorCode.USER_NOT_FOUND,
          `No roster user found with Showdown username matching "${rawName}".`,
          candidates,
        );
        resolved.push({ rawShowdownName: rawName, user: null, team: null });
      }
    }

    return resolved;
  }

  private buildPlayerDtos(resolved: ResolvedPlayer[], seasonTeams: Team[]): PlayerPreviewDto[] {
    return resolved.map((r) => {
      const dto = new PlayerPreviewDto();
      dto.rawShowdownName = r.rawShowdownName;
      dto.userId = r.user?.id ?? null;
      dto.userDisplayName =
        r.user ? [r.user.firstName, r.user.lastName].filter(Boolean).join(' ') || null : null;
      dto.teamId = r.team?.id ?? null;
      dto.teamName = r.team?.name ?? null;
      return dto;
    });
  }

  private async resolveTeamsAndMatch(
    seasonId: number,
    resolved: ResolvedPlayer[],
    players: PlayerPreviewDto[],
    errors: PreviewErrorDto[],
    pushError: (field: string, code: PreviewErrorCode, message: string, candidates?: unknown[]) => void,
  ): Promise<{ matchId: number | null; weekId: number | null; weekName: string | null }> {
    const teamA = resolved[0].team;
    const teamB = resolved[1].team;

    // If either player's team is unresolved we cannot look up the match
    if (!teamA || !teamB) {
      // Only emit MATCH_BLOCKED when BOTH are unresolved (single error, no MATCH_NOT_FOUND)
      if (!teamA && !teamB) {
        pushError('match', PreviewErrorCode.MATCH_BLOCKED, 'Cannot look up match — neither player resolved to a roster team.');
      }
      // If only one is unresolved, we still can't query — emit MATCH_BLOCKED as well
      // (spec says "unresolved players emit MATCH_BLOCKED")
      else {
        pushError('match', PreviewErrorCode.MATCH_BLOCKED, 'Cannot look up match — one or more players could not be resolved to a roster team.');
      }
      return { matchId: null, weekId: null, weekName: null };
    }

    // Load all matches in the season, then filter in-memory for both team ids (RESEARCH Pattern 5)
    const allSeasonMatches: Match[] = await this.matchRepo.find({
      where: { week: { seasonId } },
      relations: { teams: true, week: true, games: true },
    });

    const teamAId = teamA.id;
    const teamBId = teamB.id;

    const matching = allSeasonMatches.filter(
      (m) => m.teams.some((t) => t.id === teamAId) && m.teams.some((t) => t.id === teamBId),
    );

    if (matching.length === 0) {
      pushError('match', PreviewErrorCode.MATCH_NOT_FOUND, `No scheduled match found between ${players[0].teamName} and ${players[1].teamName} in this season.`);
      return { matchId: null, weekId: null, weekName: null };
    }

    if (matching.length === 1) {
      const m = matching[0];
      return { matchId: m.id, weekId: m.weekId, weekName: m.week?.name ?? null };
    }

    // 2+ matches — ambiguous
    const candidates = matching.map((m) => ({
      matchId: m.id,
      weekName: m.week?.name ?? null,
      hasGames: (m.games?.length ?? 0) > 0,
    }));
    pushError(
      'match',
      PreviewErrorCode.MATCH_AMBIGUOUS,
      `Found ${matching.length} matches between these teams — please identify the correct one.`,
      candidates,
    );
    return { matchId: null, weekId: null, weekName: null };
  }
}
