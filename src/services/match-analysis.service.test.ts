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
    mocks.parserService.parse.mockResolvedValue(makeAnalysis([PLAYER_A, PLAYER_B]));
    mocks.teamRepo.find.mockResolvedValue([TEAM_A, TEAM_B]);
    mocks.matchRepo.find.mockResolvedValue([MATCH_1]);

    const service = buildService(mocks);
    const result = await service.analyze(1, [URL_1, URL_2, URL_3]);

    expect(result.errors).toHaveLength(0);
    expect(result.matchId).toBe(50);
    expect(result.weekId).toBe(5);
    expect(result.weekName).toBe('Week 1');
    expect(result.players).toHaveLength(2);
    expect(result.players[0].userId).toBe(USER_A.id);
    expect(result.players[1].userId).toBe(USER_B.id);
    expect(result.players[0].teamId).toBe(TEAM_A.id);
    expect(result.players[1].teamId).toBe(TEAM_B.id);
    expect(result.games).toEqual([]);
    expect(result.isDecisive).toBe(false);
    expect(result.matchWinnerTeamId).toBeNull();
    expect(result.matchLoserTeamId).toBeNull();
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
    // fetchReplay should only be called for non-duplicate URLs
    expect(mocks.fetcherService.fetchReplay).not.toHaveBeenCalledWith(URL_1);
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
