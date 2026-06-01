import 'reflect-metadata';
import { Container } from 'typedi';
import {
  ReplayNotFoundError,
  ReplayPrivateError,
  ReplayTimeoutError,
  ReplayUpstreamError,
  ReplayParseError,
  ValidationError,
} from '../errors';
import { MatchAnalysisService } from './match-analysis.service';
import { PreviewErrorCode } from '../dtos/match-analysis.dto';
import type { ShowdownReplayJson } from './replay-fetcher.service';
import type { ReplayAnalysis } from '../utils/replay-parser/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeReplayJson(players: string[], id = 'gen9natdexdraft-001'): ShowdownReplayJson {
  return {
    id,
    format: 'gen9natdexdraft',
    players,
    log: '|start\n|turn|1',
    uploadtime: 1700000000,
  };
}

function makeAnalysis(playerNames: string[], replayId = 'gen9natdexdraft-001'): ReplayAnalysis {
  return {
    players: {
      [playerNames[0]]: {
        ps: playerNames[0],
        kills: { pikachu: { direct: 2, passive: 0 } },
        deaths: {},
      },
      [playerNames[1]]: {
        ps: playerNames[1],
        kills: { charizard: { direct: 1, passive: 1 } },
        deaths: { charizard: 1 },
      },
    },
    playerNames,
    info: {
      replay: `https://replay.pokemonshowdown.com/${replayId}`,
      history: '',
      turns: 30,
      winner: playerNames[0],
      loser: playerNames[1],
      rules: { recoil: 'D', suicide: 'D', abilityitem: 'P', selfteam: 'N', db: 'P', forfeit: 'N' },
      result: '1-0',
      battleId: replayId,
    },
  };
}

const PLAYER_A = 'AshKetchum';
const PLAYER_B = 'MistyWaterflower';
const URL_1 = 'https://replay.pokemonshowdown.com/gen9natdexdraft-001';
const URL_2 = 'https://replay.pokemonshowdown.com/gen9natdexdraft-002';
const URL_3 = 'https://replay.pokemonshowdown.com/gen9natdexdraft-003';

const USER_A = { id: 10, firstName: 'Ash', lastName: 'Ketchum', showdownUsername: 'AshKetchum' };
const USER_B = { id: 20, firstName: 'Misty', lastName: 'Waterflower', showdownUsername: 'MistyWaterflower' };

const TEAM_A = { id: 100, name: 'Team Pikachu', seasonId: 1, userId: 10, user: USER_A, matches: [] };
const TEAM_B = { id: 200, name: 'Team Starmie', seasonId: 1, userId: 20, user: USER_B, matches: [] };

const WEEK_1 = { id: 5, name: 'Week 1', seasonId: 1 };

const MATCH_1 = {
  id: 50,
  weekId: 5,
  winningTeamId: null,
  losingTeamId: null,
  week: WEEK_1,
  teams: [TEAM_A, TEAM_B],
  games: [],
};

const SEASON = { id: 1, numberOfGames: 3, name: 'Season 1', teams: [], weeks: [] };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMocks() {
  const fetcherService = {
    validateReplayUrl: jest.fn((url: string) => url.replace('https://replay.pokemonshowdown.com/', '')),
    fetchReplay: jest.fn(),
  };
  const parserService = { parse: jest.fn() };
  const seasonRepo = { findOne: jest.fn(), find: jest.fn() };
  const userRepo = { find: jest.fn(), findOne: jest.fn() };
  const teamRepo = { find: jest.fn(), findOne: jest.fn() };
  const matchRepo = { find: jest.fn(), findOne: jest.fn() };
  const seasonPokemonRepo = { find: jest.fn(), findOne: jest.fn() };
  return { fetcherService, parserService, seasonRepo, userRepo, teamRepo, matchRepo, seasonPokemonRepo };
}

function buildService(mocks: ReturnType<typeof makeMocks>): MatchAnalysisService {
  Container.reset();
  Container.set('SeasonRepository', mocks.seasonRepo);
  Container.set('UserRepository', mocks.userRepo);
  Container.set('TeamRepository', mocks.teamRepo);
  Container.set('MatchRepository', mocks.matchRepo);
  Container.set('SeasonPokemonRepository', mocks.seasonPokemonRepo);
  return new MatchAnalysisService(
    mocks.seasonRepo as any,
    mocks.userRepo as any,
    mocks.teamRepo as any,
    mocks.matchRepo as any,
    mocks.seasonPokemonRepo as any,
    mocks.fetcherService as any,
    mocks.parserService as any,
  );
}

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe('MatchAnalysisService.analyze — happy path', () => {
  it('resolves players, teams, and match for a valid 3-game Bo3', async () => {
    const mocks = makeMocks();

    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    mocks.fetcherService.fetchReplay.mockResolvedValue(makeReplayJson([PLAYER_A, PLAYER_B]));
    // makeAnalysis produces: PLAYER_A wins, PLAYER_B loses, pikachu/charizard as Pokémon keys
    mocks.parserService.parse.mockResolvedValue(makeAnalysis([PLAYER_A, PLAYER_B]));
    mocks.teamRepo.find.mockResolvedValue([TEAM_A, TEAM_B]);
    mocks.matchRepo.find.mockResolvedValue([MATCH_1]);
    // Stage 5: return empty pool (simplest — POKEMON_NOT_FOUND will be emitted but we only
    // assert on player/match resolution, which is the focus of this test)
    mocks.seasonPokemonRepo.find.mockResolvedValue([]);

    const service = buildService(mocks);
    const result = await service.analyze(1, [URL_1, URL_2, URL_3]);

    // Player and match resolution is the focus of this test (stage 5 Pokémon errors expected
    // because the pool is empty, but that doesn't block stages 1-4)
    const nonPokemonErrors = result.errors.filter(
      (e) => e.code !== PreviewErrorCode.POKEMON_NOT_FOUND && e.code !== PreviewErrorCode.SET_NOT_DECISIVE,
    );
    expect(nonPokemonErrors).toHaveLength(0);
    expect(result.matchId).toBe(50);
    expect(result.weekId).toBe(5);
    expect(result.weekName).toBe('Week 1');
    expect(result.players).toHaveLength(2);
    expect(result.players[0].userId).toBe(USER_A.id);
    expect(result.players[1].userId).toBe(USER_B.id);
    expect(result.players[0].teamId).toBe(TEAM_A.id);
    expect(result.players[1].teamId).toBe(TEAM_B.id);
    expect(result.games).toHaveLength(3);
    // All 3 games won by PLAYER_A → TEAM_A is match winner
    expect(result.matchWinnerTeamId).toBe(TEAM_A.id);
    expect(result.isDecisive).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Stage 1: fetch/parse errors — per-replay, non-fatal
// ---------------------------------------------------------------------------

describe('MatchAnalysisService.analyze — stage 1 fetch/parse errors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const errorCases: [string, () => Error, PreviewErrorCode][] = [
    ['ReplayNotFoundError → REPLAY_NOT_FOUND', () => new ReplayNotFoundError('gen9natdexdraft-001'), PreviewErrorCode.REPLAY_NOT_FOUND],
    ['ReplayPrivateError → REPLAY_PRIVATE', () => new ReplayPrivateError('gen9natdexdraft-001'), PreviewErrorCode.REPLAY_PRIVATE],
    ['ReplayTimeoutError → REPLAY_TIMEOUT', () => new ReplayTimeoutError('gen9natdexdraft-001'), PreviewErrorCode.REPLAY_TIMEOUT],
    ['ReplayUpstreamError → REPLAY_UPSTREAM', () => new ReplayUpstreamError('gen9natdexdraft-001', 503), PreviewErrorCode.REPLAY_UPSTREAM],
    ['ReplayParseError → REPLAY_PARSE', () => new ReplayParseError('gen9natdexdraft-001', 'parse failed'), PreviewErrorCode.REPLAY_PARSE],
    ['ValidationError → REPLAY_NOT_FOUND', () => new ValidationError('invalid url'), PreviewErrorCode.REPLAY_NOT_FOUND],
  ];

  it.each(errorCases)('%s', async (_label, makeErr, expectedCode) => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    mocks.fetcherService.fetchReplay.mockRejectedValue(makeErr());
    mocks.teamRepo.find.mockResolvedValue([TEAM_A, TEAM_B]);
    mocks.matchRepo.find.mockResolvedValue([]);

    const service = buildService(mocks);
    const result = await service.analyze(1, [URL_1]);

    expect(result.errors.some((e) => e.field === 'replays[0]' && e.code === expectedCode)).toBe(true);
  });

  it('continues pipeline after a failed replay (stage 1 non-fatal)', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    // URL_1 fails, URL_2 succeeds
    mocks.fetcherService.fetchReplay
      .mockRejectedValueOnce(new ReplayNotFoundError('gen9natdexdraft-001'))
      .mockResolvedValue(makeReplayJson([PLAYER_A, PLAYER_B], 'gen9natdexdraft-002'));
    mocks.parserService.parse.mockResolvedValue(makeAnalysis([PLAYER_A, PLAYER_B], 'gen9natdexdraft-002'));
    mocks.teamRepo.find.mockResolvedValue([TEAM_A, TEAM_B]);
    mocks.matchRepo.find.mockResolvedValue([MATCH_1]);

    const service = buildService(mocks);
    const result = await service.analyze(1, [URL_1, URL_2]);

    expect(result.errors.some((e) => e.field === 'replays[0]' && e.code === PreviewErrorCode.REPLAY_NOT_FOUND)).toBe(true);
    // Still resolves match from the 1 successful replay
    expect(result.matchId).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// Stage 1: duplicate detection (ERR-07)
// ---------------------------------------------------------------------------

describe('MatchAnalysisService.analyze — stage 1 duplicate replays', () => {
  it('emits REPLAY_DUPLICATE for repeated URLs (second occurrence)', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    mocks.fetcherService.fetchReplay.mockResolvedValue(makeReplayJson([PLAYER_A, PLAYER_B]));
    mocks.parserService.parse.mockResolvedValue(makeAnalysis([PLAYER_A, PLAYER_B]));
    mocks.teamRepo.find.mockResolvedValue([TEAM_A, TEAM_B]);
    mocks.matchRepo.find.mockResolvedValue([MATCH_1]);

    const service = buildService(mocks);
    const result = await service.analyze(1, [URL_1, URL_1, URL_2]);

    // Second occurrence (index 1) is duplicate
    expect(result.errors.some((e) => e.field === 'replays[1]' && e.code === PreviewErrorCode.REPLAY_DUPLICATE)).toBe(true);
    // First occurrence should NOT produce a duplicate error
    expect(result.errors.some((e) => e.field === 'replays[0]' && e.code === PreviewErrorCode.REPLAY_DUPLICATE)).toBe(false);
    // fetchReplay should only be called once for URL_1 (first occurrence); second occurrence is skipped
    const url1Calls = mocks.fetcherService.fetchReplay.mock.calls.filter((c: string[]) => c[0] === URL_1);
    expect(url1Calls).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Stage 2: count validation (ANLZ-01)
// ---------------------------------------------------------------------------

describe('MatchAnalysisService.analyze — stage 2 count validation', () => {
  it('emits COUNT_OUT_OF_RANGE when parsed count < ceil(numberOfGames/2) for Bo3', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue({ ...SEASON, numberOfGames: 3 });
    // Only 1 parsed replay — below min 2 for Bo3
    mocks.fetcherService.fetchReplay.mockResolvedValue(makeReplayJson([PLAYER_A, PLAYER_B]));
    mocks.parserService.parse.mockResolvedValue(makeAnalysis([PLAYER_A, PLAYER_B]));
    mocks.teamRepo.find.mockResolvedValue([TEAM_A, TEAM_B]);
    mocks.matchRepo.find.mockResolvedValue([MATCH_1]);

    const service = buildService(mocks);
    const result = await service.analyze(1, [URL_1]);

    expect(result.errors.some((e) => e.field === 'set' && e.code === PreviewErrorCode.COUNT_OUT_OF_RANGE)).toBe(true);
  });

  it('emits COUNT_OUT_OF_RANGE when parsed count > numberOfGames', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue({ ...SEASON, numberOfGames: 3 });
    // 4 replays — above max 3
    const urls = [URL_1, URL_2, URL_3, 'https://replay.pokemonshowdown.com/gen9natdexdraft-004'];
    mocks.fetcherService.fetchReplay.mockResolvedValue(makeReplayJson([PLAYER_A, PLAYER_B]));
    mocks.parserService.parse.mockResolvedValue(makeAnalysis([PLAYER_A, PLAYER_B]));
    mocks.teamRepo.find.mockResolvedValue([TEAM_A, TEAM_B]);
    mocks.matchRepo.find.mockResolvedValue([MATCH_1]);

    const service = buildService(mocks);
    const result = await service.analyze(1, urls);

    expect(result.errors.some((e) => e.field === 'set' && e.code === PreviewErrorCode.COUNT_OUT_OF_RANGE)).toBe(true);
  });

  it('does NOT emit COUNT_OUT_OF_RANGE for a valid 2-game Bo3 (min for Bo3)', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue({ ...SEASON, numberOfGames: 3 });
    mocks.fetcherService.fetchReplay.mockResolvedValue(makeReplayJson([PLAYER_A, PLAYER_B]));
    mocks.parserService.parse.mockResolvedValue(makeAnalysis([PLAYER_A, PLAYER_B]));
    mocks.teamRepo.find.mockResolvedValue([TEAM_A, TEAM_B]);
    mocks.matchRepo.find.mockResolvedValue([MATCH_1]);

    const service = buildService(mocks);
    const result = await service.analyze(1, [URL_1, URL_2]);

    expect(result.errors.some((e) => e.code === PreviewErrorCode.COUNT_OUT_OF_RANGE)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Stage 2: players consistent (ERR-06)
// ---------------------------------------------------------------------------

describe('MatchAnalysisService.analyze — stage 2 player consistency', () => {
  it('emits PLAYERS_INCONSISTENT when replay player pairs differ across set', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);

    const PLAYER_C = 'BrockTakeshi';
    mocks.fetcherService.fetchReplay
      .mockResolvedValueOnce(makeReplayJson([PLAYER_A, PLAYER_B], 'gen9natdexdraft-001'))
      .mockResolvedValueOnce(makeReplayJson([PLAYER_A, PLAYER_C], 'gen9natdexdraft-002'));
    mocks.parserService.parse
      .mockResolvedValueOnce(makeAnalysis([PLAYER_A, PLAYER_B], 'gen9natdexdraft-001'))
      .mockResolvedValueOnce(makeAnalysis([PLAYER_A, PLAYER_C], 'gen9natdexdraft-002'));
    mocks.teamRepo.find.mockResolvedValue([TEAM_A, TEAM_B]);
    mocks.matchRepo.find.mockResolvedValue([]);

    const service = buildService(mocks);
    const result = await service.analyze(1, [URL_1, URL_2]);

    expect(result.errors.some((e) => e.field === 'set' && e.code === PreviewErrorCode.PLAYERS_INCONSISTENT)).toBe(true);
  });

  it('does NOT emit PLAYERS_INCONSISTENT when player order is reversed but toID matches', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);

    // Same players, different order in second replay
    mocks.fetcherService.fetchReplay
      .mockResolvedValueOnce(makeReplayJson([PLAYER_A, PLAYER_B], 'gen9natdexdraft-001'))
      .mockResolvedValueOnce(makeReplayJson([PLAYER_B, PLAYER_A], 'gen9natdexdraft-002'));
    mocks.parserService.parse
      .mockResolvedValueOnce(makeAnalysis([PLAYER_A, PLAYER_B], 'gen9natdexdraft-001'))
      .mockResolvedValueOnce(makeAnalysis([PLAYER_B, PLAYER_A], 'gen9natdexdraft-002'));
    mocks.teamRepo.find.mockResolvedValue([TEAM_A, TEAM_B]);
    mocks.matchRepo.find.mockResolvedValue([MATCH_1]);

    const service = buildService(mocks);
    const result = await service.analyze(1, [URL_1, URL_2]);

    expect(result.errors.some((e) => e.code === PreviewErrorCode.PLAYERS_INCONSISTENT)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Stage 3: user resolution (ANLZ-03)
// ---------------------------------------------------------------------------

describe('MatchAnalysisService.analyze — stage 3 user resolution', () => {
  it('emits USER_NOT_FOUND with candidates when player does not match any roster user', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    mocks.fetcherService.fetchReplay.mockResolvedValue(makeReplayJson([PLAYER_A, 'UnknownPlayer']));
    mocks.parserService.parse.mockResolvedValue(makeAnalysis([PLAYER_A, 'UnknownPlayer']));
    // Roster: only USER_A
    mocks.teamRepo.find.mockResolvedValue([TEAM_A]);
    mocks.matchRepo.find.mockResolvedValue([]);

    const service = buildService(mocks);
    const result = await service.analyze(1, [URL_1, URL_2]);

    const userErr = result.errors.find(
      (e) => e.field === 'players[1].user' && e.code === PreviewErrorCode.USER_NOT_FOUND,
    );
    expect(userErr).toBeDefined();
    // candidates should list the remaining roster users (USER_A already matched to player[0])
    expect(Array.isArray(userErr!.candidates)).toBe(true);
  });

  it('resolves users correctly via toID normalization (case/special-char insensitive)', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);

    // Replay uses uppercase names; DB has exact same but check via toID
    mocks.fetcherService.fetchReplay.mockResolvedValue(makeReplayJson(['ash ketchum', 'misty waterflower']));
    mocks.parserService.parse.mockResolvedValue(makeAnalysis(['ash ketchum', 'misty waterflower']));
    mocks.teamRepo.find.mockResolvedValue([
      { ...TEAM_A, user: { ...USER_A, showdownUsername: 'AshKetchum' } },
      { ...TEAM_B, user: { ...USER_B, showdownUsername: 'Misty Waterflower' } },
    ]);
    mocks.matchRepo.find.mockResolvedValue([MATCH_1]);

    const service = buildService(mocks);
    const result = await service.analyze(1, [URL_1, URL_2]);

    expect(result.errors.filter((e) => e.code === PreviewErrorCode.USER_NOT_FOUND)).toHaveLength(0);
    expect(result.players[0].userId).toBe(USER_A.id);
    expect(result.players[1].userId).toBe(USER_B.id);
  });
});

// ---------------------------------------------------------------------------
// Stage 4: match lookup (ANLZ-04, ANLZ-05)
// ---------------------------------------------------------------------------

describe('MatchAnalysisService.analyze — stage 4 match lookup', () => {
  it('emits MATCH_NOT_FOUND when 0 matching season matches', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    mocks.fetcherService.fetchReplay.mockResolvedValue(makeReplayJson([PLAYER_A, PLAYER_B]));
    mocks.parserService.parse.mockResolvedValue(makeAnalysis([PLAYER_A, PLAYER_B]));
    mocks.teamRepo.find.mockResolvedValue([TEAM_A, TEAM_B]);
    mocks.matchRepo.find.mockResolvedValue([]); // no matches

    const service = buildService(mocks);
    const result = await service.analyze(1, [URL_1, URL_2]);

    expect(result.errors.some((e) => e.field === 'match' && e.code === PreviewErrorCode.MATCH_NOT_FOUND)).toBe(true);
    expect(result.matchId).toBeNull();
  });

  it('emits MATCH_AMBIGUOUS with candidates when 2+ matches found', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    mocks.fetcherService.fetchReplay.mockResolvedValue(makeReplayJson([PLAYER_A, PLAYER_B]));
    mocks.parserService.parse.mockResolvedValue(makeAnalysis([PLAYER_A, PLAYER_B]));
    mocks.teamRepo.find.mockResolvedValue([TEAM_A, TEAM_B]);

    const MATCH_2 = { ...MATCH_1, id: 51, week: { id: 6, name: 'Week 2', seasonId: 1 }, weekId: 6 };
    mocks.matchRepo.find.mockResolvedValue([MATCH_1, MATCH_2]);

    const service = buildService(mocks);
    const result = await service.analyze(1, [URL_1, URL_2]);

    const ambiguousErr = result.errors.find(
      (e) => e.field === 'match' && e.code === PreviewErrorCode.MATCH_AMBIGUOUS,
    );
    expect(ambiguousErr).toBeDefined();
    expect(Array.isArray(ambiguousErr!.candidates)).toBe(true);
    expect(ambiguousErr!.candidates!.length).toBe(2);
    expect(result.matchId).toBeNull();
  });

  it('sets matchId/weekId/weekName when exactly 1 match found', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    mocks.fetcherService.fetchReplay.mockResolvedValue(makeReplayJson([PLAYER_A, PLAYER_B]));
    mocks.parserService.parse.mockResolvedValue(makeAnalysis([PLAYER_A, PLAYER_B]));
    mocks.teamRepo.find.mockResolvedValue([TEAM_A, TEAM_B]);
    mocks.matchRepo.find.mockResolvedValue([MATCH_1]);

    const service = buildService(mocks);
    const result = await service.analyze(1, [URL_1, URL_2]);

    expect(result.matchId).toBe(50);
    expect(result.weekId).toBe(5);
    expect(result.weekName).toBe('Week 1');
  });

  it('emits MATCH_BLOCKED (not MATCH_NOT_FOUND) when both players unresolved', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    mocks.fetcherService.fetchReplay.mockResolvedValue(makeReplayJson(['UnknownA', 'UnknownB']));
    mocks.parserService.parse.mockResolvedValue(makeAnalysis(['UnknownA', 'UnknownB']));
    mocks.teamRepo.find.mockResolvedValue([]); // empty roster
    mocks.matchRepo.find.mockResolvedValue([MATCH_1]);

    const service = buildService(mocks);
    const result = await service.analyze(1, [URL_1, URL_2]);

    expect(result.errors.some((e) => e.field === 'match' && e.code === PreviewErrorCode.MATCH_BLOCKED)).toBe(true);
    expect(result.errors.some((e) => e.code === PreviewErrorCode.MATCH_NOT_FOUND)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Statelessness (ANLZ-10): no write operations on any repo
// ---------------------------------------------------------------------------

describe('MatchAnalysisService.analyze — statelessness (ANLZ-10)', () => {
  it('never calls save/insert/update/delete on any repository', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    mocks.fetcherService.fetchReplay.mockResolvedValue(makeReplayJson([PLAYER_A, PLAYER_B]));
    mocks.parserService.parse.mockResolvedValue(makeAnalysis([PLAYER_A, PLAYER_B]));
    mocks.teamRepo.find.mockResolvedValue([TEAM_A, TEAM_B]);
    mocks.matchRepo.find.mockResolvedValue([MATCH_1]);

    const service = buildService(mocks);
    await service.analyze(1, [URL_1, URL_2]);

    const repos = [mocks.seasonRepo, mocks.userRepo, mocks.teamRepo, mocks.matchRepo, mocks.seasonPokemonRepo];
    for (const repo of repos) {
      for (const method of ['save', 'insert', 'update', 'delete', 'remove'] as const) {
        expect((repo as any)[method]).toBeUndefined();
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Stage 5 helpers
// ---------------------------------------------------------------------------

/**
 * Build a SeasonPokemon fixture with the minimum fields needed for pool resolution.
 */
function makeSeasonPokemon(
  id: number,
  pokemonName: string,
  teamId: number,
  seasonId = 1,
): { id: number; seasonId: number; pokemonId: number; pokemon: { id: number; name: string }; seasonPokemonTeams: { id: number; seasonPokemonId: number; teamId: number }[] } {
  return {
    id,
    seasonId,
    pokemonId: id * 10,
    pokemon: { id: id * 10, name: pokemonName },
    seasonPokemonTeams: [{ id: id * 100, seasonPokemonId: id, teamId }],
  };
}

/**
 * Build a full ReplayAnalysis for use in stage 5 tests, with explicit
 * player stats and winner/loser info.
 */
function makeStage5Analysis(
  playerNames: string[],
  replayId: string,
  playerAKills: Record<string, { direct: number; passive: number }>,
  playerADeaths: Record<string, number>,
  playerBKills: Record<string, { direct: number; passive: number }>,
  playerBDeaths: Record<string, number>,
  winner: string,
  loser: string,
): ReplayAnalysis {
  return {
    players: {
      [playerNames[0]]: { ps: playerNames[0], kills: playerAKills, deaths: playerADeaths },
      [playerNames[1]]: { ps: playerNames[1], kills: playerBKills, deaths: playerBDeaths },
    },
    playerNames,
    info: {
      replay: `https://replay.pokemonshowdown.com/${replayId}`,
      history: '',
      turns: 30,
      winner,
      loser,
      rules: { recoil: 'D', suicide: 'D', abilityitem: 'P', selfteam: 'N', db: 'P', forfeit: 'N' },
      result: '1-0',
      battleId: replayId,
    },
  };
}

// Pool fixtures for stage 5 tests
const SP_PIKACHU_A = makeSeasonPokemon(1, 'Pikachu', TEAM_A.id);
const SP_CHARIZARD_B = makeSeasonPokemon(2, 'Charizard', TEAM_B.id);
const SP_RAPID_STRIKE_A = makeSeasonPokemon(3, 'Urshifu-Rapid-Strike', TEAM_A.id);
const SP_SINGLE_STRIKE_A = makeSeasonPokemon(4, 'Urshifu-Single-Strike', TEAM_A.id);

// ---------------------------------------------------------------------------
// Stage 5: Pokémon resolution (ANLZ-06)
// ---------------------------------------------------------------------------

describe('MatchAnalysisService.analyze — stage 5 Pokémon resolution (ANLZ-06)', () => {
  it('resolves a Pokémon name to the matching SeasonPokemon in the team pool', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);

    const analysis = makeStage5Analysis(
      [PLAYER_A, PLAYER_B],
      'gen9natdexdraft-001',
      { Pikachu: { direct: 1, passive: 0 } },
      {},
      { Charizard: { direct: 1, passive: 0 } },
      {},
      PLAYER_A,
      PLAYER_B,
    );
    mocks.fetcherService.fetchReplay.mockResolvedValue(makeReplayJson([PLAYER_A, PLAYER_B]));
    mocks.parserService.parse.mockResolvedValue(analysis);
    mocks.teamRepo.find.mockResolvedValue([TEAM_A, TEAM_B]);
    mocks.matchRepo.find.mockResolvedValue([MATCH_1]);
    // Pool for TEAM_A (Pikachu), then TEAM_B (Charizard)
    mocks.seasonPokemonRepo.find
      .mockResolvedValueOnce([SP_PIKACHU_A])
      .mockResolvedValueOnce([SP_CHARIZARD_B]);

    const service = buildService(mocks);
    const result = await service.analyze(1, [URL_1]);

    expect(result.errors.filter((e) => e.code === PreviewErrorCode.POKEMON_NOT_FOUND)).toHaveLength(0);
    expect(result.errors.filter((e) => e.code === PreviewErrorCode.POKEMON_AMBIGUOUS)).toHaveLength(0);

    const game = result.games[0];
    expect(game).toBeDefined();
    const pikachuStat = game.stats.find((s) => s.rawName === 'Pikachu');
    expect(pikachuStat).toBeDefined();
    expect(pikachuStat!.seasonPokemonId).toBe(1);
    expect(pikachuStat!.name).toBe('Pikachu');
    expect(pikachuStat!.teamId).toBe(TEAM_A.id);
  });

  it('resolves Pokémon name via normalizePokemonName + toID (strips Tera suffix)', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);

    // Parser uses Tera name; pool has base name
    const analysis = makeStage5Analysis(
      [PLAYER_A, PLAYER_B],
      'gen9natdexdraft-001',
      { 'Pikachu-Tera-Electric': { direct: 1, passive: 0 } },
      {},
      {},
      {},
      PLAYER_A,
      PLAYER_B,
    );
    mocks.fetcherService.fetchReplay.mockResolvedValue(makeReplayJson([PLAYER_A, PLAYER_B]));
    mocks.parserService.parse.mockResolvedValue(analysis);
    mocks.teamRepo.find.mockResolvedValue([TEAM_A, TEAM_B]);
    mocks.matchRepo.find.mockResolvedValue([MATCH_1]);
    mocks.seasonPokemonRepo.find
      .mockResolvedValueOnce([SP_PIKACHU_A])
      .mockResolvedValueOnce([]);

    const service = buildService(mocks);
    const result = await service.analyze(1, [URL_1]);

    // Should resolve: Pikachu-Tera-Electric normalizes to Pikachu → matches SP_PIKACHU_A
    const game = result.games[0];
    const stat = game.stats.find((s) => s.rawName === 'Pikachu-Tera-Electric');
    expect(stat).toBeDefined();
    expect(stat!.seasonPokemonId).toBe(1);
    expect(result.errors.filter((e) => e.code === PreviewErrorCode.POKEMON_NOT_FOUND)).toHaveLength(0);
  });

  it('resolves Urshifu-Rapid-Strike and Urshifu-Single-Strike as distinct formes', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);

    const analysis = makeStage5Analysis(
      [PLAYER_A, PLAYER_B],
      'gen9natdexdraft-001',
      {
        'Urshifu-Rapid-Strike': { direct: 2, passive: 0 },
        'Urshifu-Single-Strike': { direct: 1, passive: 0 },
      },
      {},
      {},
      {},
      PLAYER_A,
      PLAYER_B,
    );
    mocks.fetcherService.fetchReplay.mockResolvedValue(makeReplayJson([PLAYER_A, PLAYER_B]));
    mocks.parserService.parse.mockResolvedValue(analysis);
    mocks.teamRepo.find.mockResolvedValue([TEAM_A, TEAM_B]);
    mocks.matchRepo.find.mockResolvedValue([MATCH_1]);
    // TEAM_A has BOTH formes drafted
    mocks.seasonPokemonRepo.find
      .mockResolvedValueOnce([SP_RAPID_STRIKE_A, SP_SINGLE_STRIKE_A])
      .mockResolvedValueOnce([]);

    const service = buildService(mocks);
    const result = await service.analyze(1, [URL_1]);

    const game = result.games[0];
    const rapidStat = game.stats.find((s) => s.rawName === 'Urshifu-Rapid-Strike');
    const singleStat = game.stats.find((s) => s.rawName === 'Urshifu-Single-Strike');

    expect(rapidStat!.seasonPokemonId).toBe(SP_RAPID_STRIKE_A.id);
    expect(singleStat!.seasonPokemonId).toBe(SP_SINGLE_STRIKE_A.id);

    // Crucial: they must resolve to DIFFERENT SeasonPokemon
    expect(rapidStat!.seasonPokemonId).not.toBe(singleStat!.seasonPokemonId);

    // No errors
    expect(result.errors.filter((e) => e.code === PreviewErrorCode.POKEMON_NOT_FOUND)).toHaveLength(0);
    expect(result.errors.filter((e) => e.code === PreviewErrorCode.POKEMON_AMBIGUOUS)).toHaveLength(0);
  });

  it('emits POKEMON_NOT_FOUND with team-pool candidates when Pokémon is not in draft pool', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);

    const analysis = makeStage5Analysis(
      [PLAYER_A, PLAYER_B],
      'gen9natdexdraft-001',
      { Snorlax: { direct: 1, passive: 0 } },
      {},
      {},
      {},
      PLAYER_A,
      PLAYER_B,
    );
    mocks.fetcherService.fetchReplay.mockResolvedValue(makeReplayJson([PLAYER_A, PLAYER_B]));
    mocks.parserService.parse.mockResolvedValue(analysis);
    mocks.teamRepo.find.mockResolvedValue([TEAM_A, TEAM_B]);
    mocks.matchRepo.find.mockResolvedValue([MATCH_1]);
    // Team A pool has Pikachu, but not Snorlax
    mocks.seasonPokemonRepo.find
      .mockResolvedValueOnce([SP_PIKACHU_A])
      .mockResolvedValueOnce([]);

    const service = buildService(mocks);
    const result = await service.analyze(1, [URL_1]);

    const notFound = result.errors.find(
      (e) => e.code === PreviewErrorCode.POKEMON_NOT_FOUND,
    );
    expect(notFound).toBeDefined();
    expect(notFound!.candidates).toBeDefined();
    expect(Array.isArray(notFound!.candidates)).toBe(true);

    const snorlaxStat = result.games[0].stats.find((s) => s.rawName === 'Snorlax');
    expect(snorlaxStat!.seasonPokemonId).toBeNull();
  });

  it('emits POKEMON_AMBIGUOUS with competing candidates when normalized name hits 2+ pool entries', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);

    // Simulate a pool where two SeasonPokemon have the same normalized name
    // (edge case: DB inconsistency or normalization collision)
    const SP_URSHIFU_A1 = makeSeasonPokemon(10, 'Urshifu-Rapid-Strike', TEAM_A.id);
    const SP_URSHIFU_A2 = makeSeasonPokemon(11, 'Urshifu-Rapid-Strike', TEAM_A.id); // duplicate name in pool

    const analysis = makeStage5Analysis(
      [PLAYER_A, PLAYER_B],
      'gen9natdexdraft-001',
      { 'Urshifu-Rapid-Strike': { direct: 1, passive: 0 } },
      {},
      {},
      {},
      PLAYER_A,
      PLAYER_B,
    );
    mocks.fetcherService.fetchReplay.mockResolvedValue(makeReplayJson([PLAYER_A, PLAYER_B]));
    mocks.parserService.parse.mockResolvedValue(analysis);
    mocks.teamRepo.find.mockResolvedValue([TEAM_A, TEAM_B]);
    mocks.matchRepo.find.mockResolvedValue([MATCH_1]);
    mocks.seasonPokemonRepo.find
      .mockResolvedValueOnce([SP_URSHIFU_A1, SP_URSHIFU_A2])
      .mockResolvedValueOnce([]);

    const service = buildService(mocks);
    const result = await service.analyze(1, [URL_1]);

    const ambiguous = result.errors.find(
      (e) => e.code === PreviewErrorCode.POKEMON_AMBIGUOUS,
    );
    expect(ambiguous).toBeDefined();
    expect(Array.isArray(ambiguous!.candidates)).toBe(true);
    expect(ambiguous!.candidates!.length).toBe(2);

    const stat = result.games[0].stats.find((s) => s.rawName === 'Urshifu-Rapid-Strike');
    expect(stat!.seasonPokemonId).toBeNull();
  });

  it('emits POKEMON_NOT_FOUND with season-pool fallback when team is unresolved', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);

    const analysis = makeStage5Analysis(
      ['UnknownPlayer', PLAYER_B],
      'gen9natdexdraft-001',
      { Pikachu: { direct: 1, passive: 0 } },
      {},
      { Charizard: { direct: 1, passive: 0 } },
      {},
      'UnknownPlayer',
      PLAYER_B,
    );
    mocks.fetcherService.fetchReplay.mockResolvedValue(makeReplayJson(['UnknownPlayer', PLAYER_B]));
    mocks.parserService.parse.mockResolvedValue(analysis);
    // Only TEAM_B resolves; UnknownPlayer has no team
    mocks.teamRepo.find.mockResolvedValue([TEAM_B]);
    mocks.matchRepo.find.mockResolvedValue([]);
    // No team pool load for unknown team, but TEAM_B still gets a pool load
    mocks.seasonPokemonRepo.find.mockResolvedValue([SP_CHARIZARD_B]);

    const service = buildService(mocks);
    const result = await service.analyze(1, [URL_1]);

    // Pikachu from UnknownPlayer's pool cannot resolve → POKEMON_NOT_FOUND
    const notFound = result.errors.filter((e) => e.code === PreviewErrorCode.POKEMON_NOT_FOUND);
    expect(notFound.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Stage 5: stat mapping (ANLZ-07)
// ---------------------------------------------------------------------------

describe('MatchAnalysisService.analyze — stage 5 stat mapping (ANLZ-07)', () => {
  it('maps parser kills.direct → directKills, kills.passive → indirectKills, deaths → deaths', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);

    const analysis = makeStage5Analysis(
      [PLAYER_A, PLAYER_B],
      'gen9natdexdraft-001',
      { Pikachu: { direct: 3, passive: 1 } },
      { Pikachu: 1 }, // Pikachu died once
      { Charizard: { direct: 0, passive: 2 } },
      { Charizard: 2 },
      PLAYER_A,
      PLAYER_B,
    );
    mocks.fetcherService.fetchReplay.mockResolvedValue(makeReplayJson([PLAYER_A, PLAYER_B]));
    mocks.parserService.parse.mockResolvedValue(analysis);
    mocks.teamRepo.find.mockResolvedValue([TEAM_A, TEAM_B]);
    mocks.matchRepo.find.mockResolvedValue([MATCH_1]);
    mocks.seasonPokemonRepo.find
      .mockResolvedValueOnce([SP_PIKACHU_A])
      .mockResolvedValueOnce([SP_CHARIZARD_B]);

    const service = buildService(mocks);
    const result = await service.analyze(1, [URL_1]);

    const game = result.games[0];
    const pikachuStat = game.stats.find((s) => s.rawName === 'Pikachu');
    expect(pikachuStat!.directKills).toBe(3);
    expect(pikachuStat!.indirectKills).toBe(1);
    expect(pikachuStat!.deaths).toBe(1);

    const charizardStat = game.stats.find((s) => s.rawName === 'Charizard');
    expect(charizardStat!.directKills).toBe(0);
    expect(charizardStat!.indirectKills).toBe(2);
    expect(charizardStat!.deaths).toBe(2);
  });

  it('echoes rawName and sets teamId to the player team', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);

    const analysis = makeStage5Analysis(
      [PLAYER_A, PLAYER_B],
      'gen9natdexdraft-001',
      { Pikachu: { direct: 1, passive: 0 } },
      {},
      {},
      {},
      PLAYER_A,
      PLAYER_B,
    );
    mocks.fetcherService.fetchReplay.mockResolvedValue(makeReplayJson([PLAYER_A, PLAYER_B]));
    mocks.parserService.parse.mockResolvedValue(analysis);
    mocks.teamRepo.find.mockResolvedValue([TEAM_A, TEAM_B]);
    mocks.matchRepo.find.mockResolvedValue([MATCH_1]);
    mocks.seasonPokemonRepo.find
      .mockResolvedValueOnce([SP_PIKACHU_A])
      .mockResolvedValueOnce([]);

    const service = buildService(mocks);
    const result = await service.analyze(1, [URL_1]);

    const pikachuStat = result.games[0].stats.find((s) => s.rawName === 'Pikachu');
    expect(pikachuStat!.rawName).toBe('Pikachu');
    expect(pikachuStat!.teamId).toBe(TEAM_A.id);
  });
});

// ---------------------------------------------------------------------------
// Stage 5: per-game winner/loser/differential (ANLZ-08)
// ---------------------------------------------------------------------------

describe('MatchAnalysisService.analyze — stage 5 per-game winner/loser/differential (ANLZ-08)', () => {
  it('sets winnerTeamId, loserTeamId from parser info.winner/loser (resolved teams)', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);

    const analysis = makeStage5Analysis(
      [PLAYER_A, PLAYER_B],
      'gen9natdexdraft-001',
      { Pikachu: { direct: 1, passive: 0 } },
      {},
      { Charizard: { direct: 0, passive: 0 } },
      { Charizard: 1 },
      PLAYER_A, // PLAYER_A wins
      PLAYER_B,
    );
    mocks.fetcherService.fetchReplay.mockResolvedValue(makeReplayJson([PLAYER_A, PLAYER_B]));
    mocks.parserService.parse.mockResolvedValue(analysis);
    mocks.teamRepo.find.mockResolvedValue([TEAM_A, TEAM_B]);
    mocks.matchRepo.find.mockResolvedValue([MATCH_1]);
    mocks.seasonPokemonRepo.find
      .mockResolvedValueOnce([SP_PIKACHU_A])
      .mockResolvedValueOnce([SP_CHARIZARD_B]);

    const service = buildService(mocks);
    const result = await service.analyze(1, [URL_1]);

    const game = result.games[0];
    expect(game.winnerTeamId).toBe(TEAM_A.id);
    expect(game.loserTeamId).toBe(TEAM_B.id);
  });

  it('sets gameNumber to submission order (1-indexed)', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);

    const analysis1 = makeStage5Analysis([PLAYER_A, PLAYER_B], 'gen9natdexdraft-001', { Pikachu: { direct: 1, passive: 0 } }, {}, {}, {}, PLAYER_A, PLAYER_B);
    const analysis2 = makeStage5Analysis([PLAYER_A, PLAYER_B], 'gen9natdexdraft-002', { Pikachu: { direct: 1, passive: 0 } }, {}, {}, {}, PLAYER_B, PLAYER_A);

    mocks.fetcherService.fetchReplay
      .mockResolvedValueOnce(makeReplayJson([PLAYER_A, PLAYER_B], 'gen9natdexdraft-001'))
      .mockResolvedValueOnce(makeReplayJson([PLAYER_A, PLAYER_B], 'gen9natdexdraft-002'));
    mocks.parserService.parse
      .mockResolvedValueOnce(analysis1)
      .mockResolvedValueOnce(analysis2);
    mocks.teamRepo.find.mockResolvedValue([TEAM_A, TEAM_B]);
    mocks.matchRepo.find.mockResolvedValue([MATCH_1]);
    mocks.seasonPokemonRepo.find.mockResolvedValue([SP_PIKACHU_A]);

    const service = buildService(mocks);
    const result = await service.analyze(1, [URL_1, URL_2]);

    expect(result.games[0].gameNumber).toBe(1);
    expect(result.games[1].gameNumber).toBe(2);
    expect(result.games).toHaveLength(2);
  });

  it('computes differential = winner brought count minus dead count', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);

    // PLAYER_A (winner) brought 3 Pokémon; 1 died → differential = 2
    const analysis = makeStage5Analysis(
      [PLAYER_A, PLAYER_B],
      'gen9natdexdraft-001',
      {
        Pikachu: { direct: 2, passive: 0 },
        Snorlax: { direct: 1, passive: 0 },
        Garchomp: { direct: 0, passive: 0 },
      },
      { Pikachu: 1 }, // 1 death
      { Charizard: { direct: 0, passive: 0 } },
      { Charizard: 1 },
      PLAYER_A,
      PLAYER_B,
    );
    mocks.fetcherService.fetchReplay.mockResolvedValue(makeReplayJson([PLAYER_A, PLAYER_B]));
    mocks.parserService.parse.mockResolvedValue(analysis);
    mocks.teamRepo.find.mockResolvedValue([TEAM_A, TEAM_B]);
    mocks.matchRepo.find.mockResolvedValue([MATCH_1]);

    const SP_SNORLAX_A = makeSeasonPokemon(5, 'Snorlax', TEAM_A.id);
    const SP_GARCHOMP_A = makeSeasonPokemon(6, 'Garchomp', TEAM_A.id);
    mocks.seasonPokemonRepo.find
      .mockResolvedValueOnce([SP_PIKACHU_A, SP_SNORLAX_A, SP_GARCHOMP_A])
      .mockResolvedValueOnce([SP_CHARIZARD_B]);

    const service = buildService(mocks);
    const result = await service.analyze(1, [URL_1]);

    // Winner (PLAYER_A) brought 3 Pokémon (Pikachu, Snorlax, Garchomp), 1 dead → differential = 2
    expect(result.games[0].differential).toBe(2);
  });

  it('emits GAME_INDECISIVE and sets winner/loser/differential to null when info.winner is empty', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);

    const indecisiveAnalysis = makeStage5Analysis(
      [PLAYER_A, PLAYER_B],
      'gen9natdexdraft-001',
      { Pikachu: { direct: 0, passive: 0 } },
      {},
      { Charizard: { direct: 0, passive: 0 } },
      {},
      '', // empty winner → GAME_INDECISIVE
      '',
    );
    mocks.fetcherService.fetchReplay.mockResolvedValue(makeReplayJson([PLAYER_A, PLAYER_B]));
    mocks.parserService.parse.mockResolvedValue(indecisiveAnalysis);
    mocks.teamRepo.find.mockResolvedValue([TEAM_A, TEAM_B]);
    mocks.matchRepo.find.mockResolvedValue([MATCH_1]);
    mocks.seasonPokemonRepo.find
      .mockResolvedValueOnce([SP_PIKACHU_A])
      .mockResolvedValueOnce([SP_CHARIZARD_B]);

    const service = buildService(mocks);
    const result = await service.analyze(1, [URL_1]);

    const game = result.games[0];
    expect(game.winnerTeamId).toBeNull();
    expect(game.loserTeamId).toBeNull();
    expect(game.differential).toBeNull();

    const indecisiveErr = result.errors.find(
      (e) => e.code === PreviewErrorCode.GAME_INDECISIVE,
    );
    expect(indecisiveErr).toBeDefined();
    expect(indecisiveErr!.field).toMatch(/^games\[/);
  });
});

// ---------------------------------------------------------------------------
// Stage 5: match winner / decisiveness (ANLZ-09, ANLZ-02)
// ---------------------------------------------------------------------------

describe('MatchAnalysisService.analyze — stage 5 match winner and decisiveness (ANLZ-09, ANLZ-02)', () => {
  it('sets matchWinnerTeamId from the team with strict majority of game wins (2-1 Bo3)', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);

    // Game 1: PLAYER_A wins, Game 2: PLAYER_B wins, Game 3: PLAYER_A wins → TEAM_A is match winner
    const a1 = makeStage5Analysis([PLAYER_A, PLAYER_B], 'gen9natdexdraft-001', { Pikachu: { direct: 1, passive: 0 } }, {}, {}, {}, PLAYER_A, PLAYER_B);
    const a2 = makeStage5Analysis([PLAYER_A, PLAYER_B], 'gen9natdexdraft-002', {}, {}, { Charizard: { direct: 1, passive: 0 } }, {}, PLAYER_B, PLAYER_A);
    const a3 = makeStage5Analysis([PLAYER_A, PLAYER_B], 'gen9natdexdraft-003', { Pikachu: { direct: 1, passive: 0 } }, {}, {}, {}, PLAYER_A, PLAYER_B);

    mocks.fetcherService.fetchReplay
      .mockResolvedValueOnce(makeReplayJson([PLAYER_A, PLAYER_B], 'gen9natdexdraft-001'))
      .mockResolvedValueOnce(makeReplayJson([PLAYER_A, PLAYER_B], 'gen9natdexdraft-002'))
      .mockResolvedValueOnce(makeReplayJson([PLAYER_A, PLAYER_B], 'gen9natdexdraft-003'));
    mocks.parserService.parse
      .mockResolvedValueOnce(a1)
      .mockResolvedValueOnce(a2)
      .mockResolvedValueOnce(a3);
    mocks.teamRepo.find.mockResolvedValue([TEAM_A, TEAM_B]);
    mocks.matchRepo.find.mockResolvedValue([MATCH_1]);
    mocks.seasonPokemonRepo.find.mockResolvedValue([SP_PIKACHU_A, SP_CHARIZARD_B]);

    const service = buildService(mocks);
    const result = await service.analyze(1, [URL_1, URL_2, URL_3]);

    expect(result.matchWinnerTeamId).toBe(TEAM_A.id);
    expect(result.matchLoserTeamId).toBe(TEAM_B.id);
    expect(result.isDecisive).toBe(true);
    expect(result.errors.filter((e) => e.code === PreviewErrorCode.SET_NOT_DECISIVE)).toHaveLength(0);
  });

  it('sets isDecisive=false and emits SET_NOT_DECISIVE when neither team has strict majority (1-1)', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue({ ...SEASON, numberOfGames: 3 });

    // Only 2 replays: 1 win each → no majority → not decisive
    const a1 = makeStage5Analysis([PLAYER_A, PLAYER_B], 'gen9natdexdraft-001', { Pikachu: { direct: 1, passive: 0 } }, {}, {}, {}, PLAYER_A, PLAYER_B);
    const a2 = makeStage5Analysis([PLAYER_A, PLAYER_B], 'gen9natdexdraft-002', {}, {}, { Charizard: { direct: 1, passive: 0 } }, {}, PLAYER_B, PLAYER_A);

    mocks.fetcherService.fetchReplay
      .mockResolvedValueOnce(makeReplayJson([PLAYER_A, PLAYER_B], 'gen9natdexdraft-001'))
      .mockResolvedValueOnce(makeReplayJson([PLAYER_A, PLAYER_B], 'gen9natdexdraft-002'));
    mocks.parserService.parse
      .mockResolvedValueOnce(a1)
      .mockResolvedValueOnce(a2);
    mocks.teamRepo.find.mockResolvedValue([TEAM_A, TEAM_B]);
    mocks.matchRepo.find.mockResolvedValue([MATCH_1]);
    mocks.seasonPokemonRepo.find.mockResolvedValue([SP_PIKACHU_A, SP_CHARIZARD_B]);

    const service = buildService(mocks);
    const result = await service.analyze(1, [URL_1, URL_2]);

    expect(result.isDecisive).toBe(false);
    expect(result.matchWinnerTeamId).toBeNull();
    expect(result.matchLoserTeamId).toBeNull();

    const notDecisive = result.errors.find((e) => e.code === PreviewErrorCode.SET_NOT_DECISIVE);
    expect(notDecisive).toBeDefined();
    expect(notDecisive!.field).toBe('set');
  });

  it('games[].length equals the number of parsed replays', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);

    const a1 = makeStage5Analysis([PLAYER_A, PLAYER_B], 'gen9natdexdraft-001', {}, {}, {}, {}, PLAYER_A, PLAYER_B);
    const a2 = makeStage5Analysis([PLAYER_A, PLAYER_B], 'gen9natdexdraft-002', {}, {}, {}, {}, PLAYER_B, PLAYER_A);

    mocks.fetcherService.fetchReplay
      .mockResolvedValueOnce(makeReplayJson([PLAYER_A, PLAYER_B], 'gen9natdexdraft-001'))
      .mockResolvedValueOnce(makeReplayJson([PLAYER_A, PLAYER_B], 'gen9natdexdraft-002'));
    mocks.parserService.parse
      .mockResolvedValueOnce(a1)
      .mockResolvedValueOnce(a2);
    mocks.teamRepo.find.mockResolvedValue([TEAM_A, TEAM_B]);
    mocks.matchRepo.find.mockResolvedValue([MATCH_1]);
    mocks.seasonPokemonRepo.find.mockResolvedValue([]);

    const service = buildService(mocks);
    const result = await service.analyze(1, [URL_1, URL_2]);

    expect(result.games).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Stage 5: statelessness preserved (ANLZ-10)
// ---------------------------------------------------------------------------

describe('MatchAnalysisService.analyze — stage 5 statelessness (ANLZ-10)', () => {
  it('never calls write methods on any repo even with stage 5 Pokémon resolution', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);

    const analysis = makeStage5Analysis(
      [PLAYER_A, PLAYER_B],
      'gen9natdexdraft-001',
      { Pikachu: { direct: 1, passive: 0 } },
      {},
      { Charizard: { direct: 1, passive: 0 } },
      {},
      PLAYER_A,
      PLAYER_B,
    );
    mocks.fetcherService.fetchReplay.mockResolvedValue(makeReplayJson([PLAYER_A, PLAYER_B]));
    mocks.parserService.parse.mockResolvedValue(analysis);
    mocks.teamRepo.find.mockResolvedValue([TEAM_A, TEAM_B]);
    mocks.matchRepo.find.mockResolvedValue([MATCH_1]);
    mocks.seasonPokemonRepo.find.mockResolvedValue([SP_PIKACHU_A, SP_CHARIZARD_B]);

    const service = buildService(mocks);
    await service.analyze(1, [URL_1]);

    const repos = [mocks.seasonRepo, mocks.userRepo, mocks.teamRepo, mocks.matchRepo, mocks.seasonPokemonRepo];
    for (const repo of repos) {
      for (const method of ['save', 'insert', 'update', 'delete', 'remove'] as const) {
        expect((repo as any)[method]).toBeUndefined();
      }
    }
  });
});
