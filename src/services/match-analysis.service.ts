import { Service, Inject } from 'typedi';
import { In, Repository } from 'typeorm';
import {
  ReplayNotFoundError,
  ReplayPrivateError,
  ReplayTimeoutError,
  ReplayUpstreamError,
  ReplayParseError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  StructuredConflictError,
} from '../errors';
import {
  GamePreviewDto,
  MatchPreviewDto,
  PlayerPreviewDto,
  PreviewErrorCode,
  PreviewErrorDto,
  StatPreviewDto,
} from '../dtos/match-analysis.dto';
import { SubmitInputDto } from '../dtos/submit-input.dto';
import { Season } from '../entities/season.entity';
import { User } from '../entities/user.entity';
import { Team } from '../entities/team.entity';
import { Match } from '../entities/match.entity';
import { Game } from '../entities/game.entity';
import { GameStat } from '../entities/game-stat.entity';
import { SeasonPokemon } from '../entities/season-pokemon.entity';
import { ReplayFetcherService, ShowdownReplayJson } from './replay-fetcher.service';
import { ReplayParserService } from './replay-parser.service';
import { ReplayAnalysis } from '../utils/replay-parser/types';
import { toID } from '../utils/showdown-id.utils';
import { normalizePokemonName } from '../utils/pokemon-name.utils';
import AppDataSource from '../config/database.config';

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
    @Inject('GameRepository') private gameRepo: Repository<Game>,
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
    preview.errors = errors;

    // STAGE 5: Pokémon resolution + stat mapping + per-game winners + match winner
    await this.resolveStats(seasonId, parsed, players, preview, errors, pushError);

    return preview;
  }

  // ---------------------------------------------------------------------------
  // submit() — transactional write path (SUB-01..SUB-04)
  // ---------------------------------------------------------------------------

  /**
   * Re-validates referenced IDs against the live DB (D-04/D-05), applies
   * structural sanity checks (D-06), detects duplicate replay links from two
   * sources (D-07), handles overwrite protection (D-02/D-03), and persists
   * games + game-stats + match winner/loser atomically (SUB-01).
   *
   * Throws 4xx errors directly (NOT an errors[] array like analyze()).
   * NEVER contacts Showdown (D-05).
   */
  async submit(
    leagueId: number,
    dto: SubmitInputDto,
  ): Promise<{ matchId: number; games: Array<{ id: number; gameNumber: number; replayLink: string }> }> {
    // ---- Pre-transaction re-validation (D-04) ----
    // Load the match with all relations needed for validation
    const match = await this.matchRepo.findOne({
      where: { id: dto.matchId },
      relations: { teams: true, week: true, games: true },
      // 'query' strategy avoids the teams × games Cartesian product (Neon egress). See base.service.ts.
      relationLoadStrategy: 'query',
    });

    if (!match) {
      throw new NotFoundError('Match', dto.matchId);
    }

    // Verify match belongs to the submitted seasonId via week.seasonId
    if (match.week.seasonId !== dto.seasonId) {
      throw new ValidationError(
        `Match ${dto.matchId} does not belong to season ${dto.seasonId}`,
      );
    }

    // Build set of valid teamIds from match.teams
    const validTeamIds = new Set(match.teams.map((t) => t.id));

    // Load the season to get numberOfGames for structural validation
    const season = await this.seasonRepo.findOne({ where: { id: dto.seasonId } });
    if (!season) {
      throw new NotFoundError('Season', dto.seasonId);
    }

    // Cross-league authorization (CR-01): the route's :leagueId authorizes the
    // caller as a moderator of that league only. The season must belong to it,
    // otherwise a league-A moderator could write to a league-B match by passing
    // a league-B seasonId in the body (threat T-04-07).
    if (season.leagueId !== leagueId) {
      throw new ForbiddenError(
        `Season ${dto.seasonId} does not belong to league ${leagueId}`,
      );
    }

    const numberOfGames = season.numberOfGames ?? 3;

    // Load all seasonPokemon ids for this season
    const seasonPokemons = await this.seasonPokemonRepo.find({
      where: { seasonId: dto.seasonId },
      select: ['id'],
    });
    const validSeasonPokemonIds = new Set(seasonPokemons.map((sp) => sp.id));

    // Re-validate per-game teamIds and per-stat seasonPokemonIds
    for (let i = 0; i < dto.games.length; i++) {
      const game = dto.games[i];

      if (!validTeamIds.has(game.winningTeamId)) {
        throw new ValidationError(
          `games[${i}].winningTeamId ${game.winningTeamId} is not a participant team in match ${dto.matchId}`,
        );
      }
      if (!validTeamIds.has(game.losingTeamId)) {
        throw new ValidationError(
          `games[${i}].losingTeamId ${game.losingTeamId} is not a participant team in match ${dto.matchId}`,
        );
      }

      for (let j = 0; j < game.stats.length; j++) {
        const stat = game.stats[j];
        if (!validSeasonPokemonIds.has(stat.seasonPokemonId)) {
          throw new NotFoundError('SeasonPokemon', stat.seasonPokemonId);
        }
      }
    }

    // ---- Structural sanity checks (D-06) ----
    for (let i = 0; i < dto.games.length; i++) {
      const game = dto.games[i];

      if (game.winningTeamId === game.losingTeamId) {
        throw new ValidationError(
          `games[${i}]: winningTeamId and losingTeamId must be distinct`,
        );
      }
      if (game.differential < 0) {
        throw new ValidationError(
          `games[${i}]: differential must be >= 0`,
        );
      }
      if (game.gameNumber < 1 || game.gameNumber > numberOfGames) {
        throw new ValidationError(
          `games[${i}]: gameNumber ${game.gameNumber} is out of range 1..${numberOfGames}`,
        );
      }
    }

    // Compute overall match winner/loser from submitted game results
    const gameWins = new Map<number, number>();
    for (const game of dto.games) {
      gameWins.set(game.winningTeamId, (gameWins.get(game.winningTeamId) ?? 0) + 1);
    }

    const totalGames = dto.games.length;
    const majority = totalGames / 2;
    let matchWinnerTeamId: number | null = null;
    let matchLoserTeamId: number | null = null;

    for (const [teamId, wins] of gameWins.entries()) {
      if (wins > majority) {
        matchWinnerTeamId = teamId;
        break;
      }
    }

    // Validate match winner/loser are among the match's teams
    if (matchWinnerTeamId === null || !validTeamIds.has(matchWinnerTeamId)) {
      throw new ValidationError(
        `Computed match winner is not one of the match participant teams`,
      );
    }

    // The loser is the other team
    for (const teamId of validTeamIds) {
      if (teamId !== matchWinnerTeamId) {
        matchLoserTeamId = teamId;
        break;
      }
    }

    if (matchLoserTeamId === null || !validTeamIds.has(matchLoserTeamId)) {
      throw new ValidationError(
        `Computed match loser is not one of the match participant teams`,
      );
    }

    // ---- Within-set duplicate-link pre-check (D-07) ----
    const seenLinks = new Set<string>();
    const duplicateLinks: string[] = [];
    for (const game of dto.games) {
      if (seenLinks.has(game.replayLink)) {
        duplicateLinks.push(game.replayLink);
      }
      seenLinks.add(game.replayLink);
    }

    if (duplicateLinks.length > 0) {
      throw new StructuredConflictError('Duplicate replay link in submission', {
        duplicateLinks,
      });
    }

    // ---- Overwrite handling (D-02/D-03) ----
    // Keyed off presence of Game rows, NOT match.winningTeamId (D-02)
    const existingGames = match.games ?? [];

    if (existingGames.length > 0 && dto.confirmOverwrite !== true) {
      // Build structured existing-game summary with stats for the 409 detail
      const existingGameIds = existingGames.map((g) => g.id);
      const existingGameStats = await this.gameRepo
        .createQueryBuilder('game')
        .leftJoinAndSelect('game.gameStats', 'gameStat')
        .where('game.id IN (:...ids)', { ids: existingGameIds })
        .getMany();

      const existingGamesSummary = existingGameStats.map((g) => ({
        id: g.id,
        gameNumber: g.gameNumber,
        replayLink: g.replayLink,
        winningTeamId: g.winningTeamId,
        losingTeamId: g.losingTeamId,
        differential: g.differential,
        stats: (g.gameStats ?? []).map((gs) => ({
          seasonPokemonId: gs.seasonPokemonId,
          directKills: gs.directKills,
          indirectKills: gs.indirectKills,
          deaths: gs.deaths,
        })),
      }));

      throw new StructuredConflictError('Match already has results — confirm overwrite', {
        existingGames: existingGamesSummary,
      });
    }

    // ---- Transactional write (SUB-01) ----
    const createdGames = await AppDataSource.transaction(async (manager) => {
      const gameRepo = manager.getRepository(Game);
      const gameStatRepo = manager.getRepository(GameStat);
      const matchRepo = manager.getRepository(Match);

      // Overwrite: delete existing stats then games then reset match result (D-03)
      if (existingGames.length > 0 && dto.confirmOverwrite === true) {
        const existingGameIds = existingGames.map((g) => g.id);
        await gameStatRepo.delete({ gameId: In(existingGameIds) });
        await gameRepo.delete({ matchId: dto.matchId });
        // Reset match winner/loser
        await matchRepo.update(dto.matchId, {
          winningTeamId: null as any,
          losingTeamId: null as any,
        });
      }

      // Write new games and their stats
      const savedGames: Game[] = [];

      for (const gameDto of dto.games) {
        const newGame = gameRepo.create({
          matchId: dto.matchId,
          winningTeamId: gameDto.winningTeamId,
          losingTeamId: gameDto.losingTeamId,
          differential: gameDto.differential,
          replayLink: gameDto.replayLink,
          gameNumber: gameDto.gameNumber,
        });

        let savedGame: Game;
        try {
          savedGame = await gameRepo.save(newGame);
        } catch (err: any) {
          const isUniqueViolation =
            err?.code === '23505' ||
            (typeof err?.message === 'string' &&
              err.message.toLowerCase().includes('duplicate'));
          if (isUniqueViolation) {
            throw new StructuredConflictError('Duplicate replay link', {
              duplicateLinks: [gameDto.replayLink],
            });
          }
          throw err;
        }

        // Write game stats for this game
        for (const statDto of gameDto.stats) {
          const newStat = gameStatRepo.create({
            gameId: savedGame.id,
            seasonPokemonId: statDto.seasonPokemonId,
            directKills: statDto.directKills,
            indirectKills: statDto.indirectKills,
            deaths: statDto.deaths,
          });
          await gameStatRepo.save(newStat);
        }

        savedGames.push(savedGame);
      }

      // Set match winner/loser
      await matchRepo.update(dto.matchId, {
        winningTeamId: matchWinnerTeamId!,
        losingTeamId: matchLoserTeamId!,
      });

      return savedGames;
    });

    return {
      matchId: dto.matchId,
      games: createdGames.map((g) => ({
        id: g.id,
        gameNumber: g.gameNumber,
        replayLink: g.replayLink,
      })),
    };
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
      // 'query' strategy avoids the teams × games Cartesian product across all matches (Neon egress).
      relationLoadStrategy: 'query',
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

  // ---------------------------------------------------------------------------
  // Stage 5: Pokémon resolution + stat mapping + per-game winners + match winner
  // ---------------------------------------------------------------------------

  /**
   * Stage 5 entry point. Bulk-loads each team's draft pool once, then iterates
   * over each parsed replay to build GamePreviewDto entries with StatPreviewDto
   * per Pokémon. After all games are computed, derives match winner/loser/
   * decisiveness.
   *
   * NEVER writes to the database (ANLZ-10).
   */
  private async resolveStats(
    seasonId: number,
    parsed: ParsedReplay[],
    players: PlayerPreviewDto[],
    preview: MatchPreviewDto,
    errors: PreviewErrorDto[],
    pushError: (field: string, code: PreviewErrorCode, message: string, candidates?: unknown[]) => void,
  ): Promise<void> {
    // Build player-name → PlayerPreviewDto lookup (keyed by toID of raw showdown name)
    // so we can map parser player names → team IDs.
    const playerByIdKey = new Map<string, PlayerPreviewDto>();
    for (const p of players) {
      playerByIdKey.set(toID(p.rawShowdownName), p);
    }

    // Bulk-load each resolved team's draft pool ONCE (Pitfall 2 — avoid N+1).
    // Map: teamId → SeasonPokemon[]
    const poolByTeamId = new Map<number, SeasonPokemon[]>();
    for (const p of players) {
      if (p.teamId !== null && !poolByTeamId.has(p.teamId)) {
        const pool = await this.seasonPokemonRepo.find({
          where: { seasonId, seasonPokemonTeams: { teamId: p.teamId } },
          relations: { pokemon: true, seasonPokemonTeams: true },
          relationLoadStrategy: 'query',
        });
        poolByTeamId.set(p.teamId, pool);
      }
    }

    // Lazily-loaded full season pool, used as candidate fallback when a player's
    // team is unresolved (teamId null). Loaded at most once (Pitfall 2 — avoid N+1):
    // never fetched when every player resolves to a team.
    let seasonPool: SeasonPokemon[] | null = null;
    const loadSeasonPool = async (): Promise<SeasonPokemon[]> => {
      if (seasonPool === null) {
        seasonPool =
          (await this.seasonPokemonRepo.find({
            where: { seasonId },
            relations: { pokemon: true, seasonPokemonTeams: true },
            relationLoadStrategy: 'query',
          })) ?? [];
      }
      return seasonPool;
    };

    // Process each parsed replay in submission order (1-indexed gameNumber)
    const games: GamePreviewDto[] = [];
    const gameWins = new Map<number, number>(); // teamId → win count

    for (let i = 0; i < parsed.length; i++) {
      const { url, analysis } = parsed[i];
      const gameDto = new GamePreviewDto();
      gameDto.gameNumber = i + 1;
      gameDto.replayUrl = url;
      gameDto.stats = [];

      // Build stats for each player in this replay
      for (const [rawPlayerName, playerStats] of Object.entries(analysis.players)) {
        const playerIdKey = toID(rawPlayerName);
        const playerDto = playerByIdKey.get(playerIdKey);
        const teamId = playerDto?.teamId ?? null;
        const teamPool = teamId !== null ? (poolByTeamId.get(teamId) ?? []) : [];

        // Build a name-key → SeasonPokemon[] map from this team's pool
        const poolByKey = new Map<string, SeasonPokemon[]>();
        for (const sp of teamPool) {
          const key = toID(normalizePokemonName(sp.pokemon.name));
          if (!poolByKey.has(key)) {
            poolByKey.set(key, []);
          }
          poolByKey.get(key)!.push(sp);
        }

        // Collect all Pokémon names from kills + deaths for this player
        const allPokemonNames = new Set([
          ...Object.keys(playerStats.kills),
          ...Object.keys(playerStats.deaths),
        ]);

        for (const rawPokeName of allPokemonNames) {
          const statDto = new StatPreviewDto();
          statDto.rawName = rawPokeName;
          statDto.teamId = teamId;
          statDto.directKills = playerStats.kills[rawPokeName]?.direct ?? 0;
          statDto.indirectKills = playerStats.kills[rawPokeName]?.passive ?? 0;
          statDto.deaths = playerStats.deaths[rawPokeName] ?? 0;

          // Resolve via normalizePokemonName + toID
          const normalizedKey = toID(normalizePokemonName(rawPokeName));
          const poolMatches = poolByKey.get(normalizedKey) ?? [];

          if (poolMatches.length === 1) {
            // Resolved
            statDto.seasonPokemonId = poolMatches[0].id;
            statDto.name = poolMatches[0].pokemon.name;
          } else if (poolMatches.length > 1) {
            // Ambiguous — 2+ entries for same normalized key
            statDto.seasonPokemonId = null;
            statDto.name = null;
            const candidates = poolMatches.map((sp) => ({
              seasonPokemonId: sp.id,
              name: sp.pokemon.name,
            }));
            pushError(
              `games[${i}].stats`,
              PreviewErrorCode.POKEMON_AMBIGUOUS,
              `Pokémon "${rawPokeName}" matches ${poolMatches.length} entries in the draft pool — cannot resolve uniquely.`,
              candidates,
            );
          } else {
            // Not found — emit with team pool candidates, or the full season pool
            // when the player's team is unresolved (teamId null) so the moderator
            // still gets an actionable override list.
            statDto.seasonPokemonId = null;
            statDto.name = null;
            const candidatePool =
              teamId !== null ? teamPool : await loadSeasonPool();
            const candidates = candidatePool.map((sp) => ({
              seasonPokemonId: sp.id,
              name: sp.pokemon.name,
            }));
            pushError(
              `games[${i}].stats`,
              PreviewErrorCode.POKEMON_NOT_FOUND,
              teamId !== null
                ? `Pokémon "${rawPokeName}" was not found in the team's draft pool.`
                : `Pokémon "${rawPokeName}" was not found in the season pool.`,
              candidates,
            );
          }

          gameDto.stats.push(statDto);
        }
      }

      // Per-game winner/loser/differential
      this.computeGameResult(i, analysis, playerByIdKey, gameDto, errors, pushError);

      // Track game win for match winner computation
      if (gameDto.winnerTeamId !== null) {
        gameWins.set(gameDto.winnerTeamId, (gameWins.get(gameDto.winnerTeamId) ?? 0) + 1);
      }

      games.push(gameDto);
    }

    preview.games = games;

    // Match winner/loser/decisiveness
    this.computeMatchResult(games, gameWins, preview, errors, pushError);
  }

  /**
   * Derive per-game winner, loser, and differential from the parser's
   * info.winner / info.loser fields.
   */
  private computeGameResult(
    gameIndex: number,
    analysis: ReplayAnalysis,
    playerByIdKey: Map<string, PlayerPreviewDto>,
    gameDto: GamePreviewDto,
    errors: PreviewErrorDto[],
    pushError: (field: string, code: PreviewErrorCode, message: string, candidates?: unknown[]) => void,
  ): void {
    const rawWinner = analysis.info.winner;
    const rawLoser = analysis.info.loser;

    if (!rawWinner) {
      // GAME_INDECISIVE (Pitfall 5)
      gameDto.winnerTeamId = null;
      gameDto.loserTeamId = null;
      gameDto.differential = null;
      pushError(
        `games[${gameIndex}]`,
        PreviewErrorCode.GAME_INDECISIVE,
        `Game ${gameIndex + 1} has no declared winner — may be a forfeit or tie.`,
      );
      return;
    }

    const winnerPlayer = playerByIdKey.get(toID(rawWinner));
    const loserPlayer = playerByIdKey.get(toID(rawLoser));

    gameDto.winnerTeamId = winnerPlayer?.teamId ?? null;
    gameDto.loserTeamId = loserPlayer?.teamId ?? null;

    // Differential: winner's brought Pokémon minus winner's dead Pokémon (Pitfall 6)
    const winnerStats = analysis.players[rawWinner];
    if (winnerStats) {
      const brought = Object.keys(winnerStats.kills).length; // all Pokémon in kills map = brought
      const dead = Object.values(winnerStats.deaths).filter((d) => d >= 1).length;
      gameDto.differential = brought - dead;
    } else {
      gameDto.differential = null;
    }
  }

  /**
   * Compute overall match winner/loser from game-win counts, and set isDecisive.
   * A team wins if it has STRICTLY MORE THAN HALF of the submitted (parsed) games.
   */
  private computeMatchResult(
    games: GamePreviewDto[],
    gameWins: Map<number, number>,
    preview: MatchPreviewDto,
    errors: PreviewErrorDto[],
    pushError: (field: string, code: PreviewErrorCode, message: string, candidates?: unknown[]) => void,
  ): void {
    const totalGames = games.length;
    const majority = totalGames / 2; // strict majority = > half

    let winnerTeamId: number | null = null;
    let loserTeamId: number | null = null;

    for (const [teamId, wins] of gameWins.entries()) {
      if (wins > majority) {
        winnerTeamId = teamId;
        break;
      }
    }

    if (winnerTeamId !== null) {
      // Find the loser: the other resolved team
      for (const [teamId] of gameWins.entries()) {
        if (teamId !== winnerTeamId) {
          loserTeamId = teamId;
          break;
        }
      }
      // If only one team in gameWins (e.g. all wins by same team, other team 0),
      // find the loser from the preview.players list
      if (loserTeamId === null) {
        const winnerIdKey = winnerTeamId;
        for (const p of preview.players) {
          if (p.teamId !== null && p.teamId !== winnerIdKey) {
            loserTeamId = p.teamId;
            break;
          }
        }
      }
      preview.matchWinnerTeamId = winnerTeamId;
      preview.matchLoserTeamId = loserTeamId;
      preview.isDecisive = true;
    } else {
      // No majority
      preview.matchWinnerTeamId = null;
      preview.matchLoserTeamId = null;
      preview.isDecisive = false;

      // Only emit SET_NOT_DECISIVE if there are any games (not just zero games)
      if (totalGames > 0) {
        pushError(
          'set',
          PreviewErrorCode.SET_NOT_DECISIVE,
          `No team has a strict majority of game wins (total games: ${totalGames}) — set is not decisive.`,
        );
      }
    }
  }
}
