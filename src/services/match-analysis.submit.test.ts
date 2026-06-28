import 'reflect-metadata';
import { Container } from 'typedi';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  StructuredConflictError,
} from '../errors';
import { MatchAnalysisService } from './match-analysis.service';
import { SubmitInputDto, SubmitGameInputDto, SubmitStatInputDto } from '../dtos/submit-input.dto';

// ---------------------------------------------------------------------------
// Mock AppDataSource
// ---------------------------------------------------------------------------

// Mock manager instance — per-entity repo mocks, set up per test
const mockManagerGameRepo = {
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
};
const mockManagerGameStatRepo = {
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};
const mockManagerMatchRepo = {
  save: jest.fn(),
  update: jest.fn(),
};

const mockManager = {
  getRepository: jest.fn((entity: any) => {
    // Identify by entity name or class
    const name = typeof entity === 'function' ? entity.name : String(entity);
    if (name === 'Game') return mockManagerGameRepo;
    if (name === 'GameStat') return mockManagerGameStatRepo;
    if (name === 'Match') return mockManagerMatchRepo;
    return {};
  }),
};

jest.mock('../config/database.config', () => ({
  __esModule: true,
  default: {
    transaction: jest.fn(async (cb: (manager: any) => Promise<any>) => cb(mockManager)),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const AppDataSource = require('../config/database.config').default;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SEASON_ID = 1;
const MATCH_ID = 50;
const LEAGUE_ID = 10;
const TEAM_A_ID = 100;
const TEAM_B_ID = 200;
const SP_1 = 301; // seasonPokemonId for Pikachu
const SP_2 = 302; // seasonPokemonId for Charizard

const WEEK_1 = { id: 5, name: 'Week 1', seasonId: SEASON_ID };

const SEASON = { id: SEASON_ID, numberOfGames: 3, leagueId: LEAGUE_ID };

const TEAM_A = { id: TEAM_A_ID, name: 'Team Pikachu', seasonId: SEASON_ID };
const TEAM_B = { id: TEAM_B_ID, name: 'Team Starmie', seasonId: SEASON_ID };

const MATCH_NO_GAMES = {
  id: MATCH_ID,
  weekId: WEEK_1.id,
  week: WEEK_1,
  teams: [TEAM_A, TEAM_B],
  games: [],
  winningTeamId: null,
  losingTeamId: null,
};

const REPLAY_URL_1 = 'https://replay.pokemonshowdown.com/gen9natdexdraft-001';
const REPLAY_URL_2 = 'https://replay.pokemonshowdown.com/gen9natdexdraft-002';
const REPLAY_URL_3 = 'https://replay.pokemonshowdown.com/gen9natdexdraft-003';

// Helper: build a valid SubmitGameInputDto
function makeGameInput(
  overrides: Partial<SubmitGameInputDto> = {},
): SubmitGameInputDto {
  return Object.assign(new SubmitGameInputDto(), {
    gameNumber: 1,
    replayLink: REPLAY_URL_1,
    winningTeamId: TEAM_A_ID,
    losingTeamId: TEAM_B_ID,
    differential: 2,
    stats: [
      Object.assign(new SubmitStatInputDto(), {
        seasonPokemonId: SP_1,
        directKills: 2,
        indirectKills: 0,
        deaths: 0,
      }),
    ],
    ...overrides,
  });
}

// Helper: build a valid SubmitInputDto for a Bo3 (2-game sweep)
function makeDto(overrides: Partial<SubmitInputDto> = {}): SubmitInputDto {
  return Object.assign(new SubmitInputDto(), {
    seasonId: SEASON_ID,
    matchId: MATCH_ID,
    confirmOverwrite: false,
    games: [
      makeGameInput({ gameNumber: 1, replayLink: REPLAY_URL_1, winningTeamId: TEAM_A_ID, losingTeamId: TEAM_B_ID }),
      makeGameInput({ gameNumber: 2, replayLink: REPLAY_URL_2, winningTeamId: TEAM_A_ID, losingTeamId: TEAM_B_ID }),
    ],
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Mock helpers — mirrors makeMocks/buildService in match-analysis.service.test.ts
// ---------------------------------------------------------------------------

function makeMocks() {
  const fetcherService = {
    validateReplayUrl: jest.fn(),
    fetchReplay: jest.fn(),
  };
  const parserService = { parse: jest.fn() };
  const seasonRepo = { findOne: jest.fn(), find: jest.fn() };
  const userRepo = { find: jest.fn(), findOne: jest.fn() };
  const teamRepo = { find: jest.fn(), findOne: jest.fn() };
  const matchRepo = { find: jest.fn(), findOne: jest.fn() };
  const seasonPokemonRepo = { find: jest.fn(), findOne: jest.fn() };
  const gameRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  return {
    fetcherService,
    parserService,
    seasonRepo,
    userRepo,
    teamRepo,
    matchRepo,
    seasonPokemonRepo,
    gameRepo,
  };
}

function buildService(mocks: ReturnType<typeof makeMocks>): MatchAnalysisService {
  Container.reset();
  Container.set('SeasonRepository', mocks.seasonRepo);
  Container.set('UserRepository', mocks.userRepo);
  Container.set('TeamRepository', mocks.teamRepo);
  Container.set('MatchRepository', mocks.matchRepo);
  Container.set('SeasonPokemonRepository', mocks.seasonPokemonRepo);
  Container.set('GameRepository', mocks.gameRepo);
  return new MatchAnalysisService(
    mocks.seasonRepo as any,
    mocks.userRepo as any,
    mocks.teamRepo as any,
    mocks.matchRepo as any,
    mocks.seasonPokemonRepo as any,
    mocks.gameRepo as any,
    mocks.fetcherService as any,
    mocks.parserService as any,
  );
}

// ---------------------------------------------------------------------------
// Reset manager mocks before each test
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();

  // Default manager game repo: create returns the object passed, save returns it with an id
  let gameIdCounter = 1000;
  mockManagerGameRepo.create.mockImplementation((data: any) => ({ ...data }));
  mockManagerGameRepo.save.mockImplementation(async (game: any) => ({ ...game, id: gameIdCounter++ }));
  mockManagerGameRepo.delete.mockResolvedValue({ affected: 1 });
  mockManagerGameRepo.update.mockResolvedValue({ affected: 1 });

  mockManagerGameStatRepo.create.mockImplementation((data: any) => ({ ...data }));
  mockManagerGameStatRepo.save.mockImplementation(async (stat: any) => ({ ...stat, id: 9000 }));
  mockManagerGameStatRepo.delete.mockResolvedValue({ affected: 1 });

  mockManagerMatchRepo.update.mockResolvedValue({ affected: 1 });
  mockManagerMatchRepo.save.mockResolvedValue({});

  // Ensure transaction calls through
  AppDataSource.transaction.mockImplementation(async (cb: (m: any) => Promise<any>) => cb(mockManager));
});

// ---------------------------------------------------------------------------
// Happy path (SUB-01): writes games + game-stats + match winner inside transaction
// ---------------------------------------------------------------------------

describe('MatchAnalysisService.submit — happy path', () => {
  it('writes games, game-stats, and match winner/loser atomically', async () => {
    const mocks = makeMocks();

    mocks.matchRepo.findOne.mockResolvedValue(MATCH_NO_GAMES);
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    mocks.seasonPokemonRepo.find.mockResolvedValue([{ id: SP_1 }, { id: SP_2 }]);

    const service = buildService(mocks);
    const dto = makeDto();

    const result = await service.submit(LEAGUE_ID, dto);

    // Returns match summary
    expect(result.matchId).toBe(MATCH_ID);
    expect(result.games).toHaveLength(2);

    // Transaction was called once
    expect(AppDataSource.transaction).toHaveBeenCalledTimes(1);

    // Games were created and saved
    expect(mockManagerGameRepo.create).toHaveBeenCalledTimes(2);
    expect(mockManagerGameRepo.save).toHaveBeenCalledTimes(2);

    // Stats were created and saved (1 stat per game × 2 games = 2)
    expect(mockManagerGameStatRepo.create).toHaveBeenCalledTimes(2);
    expect(mockManagerGameStatRepo.save).toHaveBeenCalledTimes(2);

    // Match winner/loser set
    expect(mockManagerMatchRepo.update).toHaveBeenCalledWith(
      MATCH_ID,
      expect.objectContaining({ winningTeamId: TEAM_A_ID, losingTeamId: TEAM_B_ID }),
    );
  });

  it('never calls fetcherService or parserService', async () => {
    const mocks = makeMocks();
    mocks.matchRepo.findOne.mockResolvedValue(MATCH_NO_GAMES);
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    mocks.seasonPokemonRepo.find.mockResolvedValue([{ id: SP_1 }]);

    const service = buildService(mocks);
    await service.submit(LEAGUE_ID, makeDto());

    expect(mocks.fetcherService.fetchReplay).not.toHaveBeenCalled();
    expect(mocks.parserService.parse).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Within-set duplicate link (SUB-02, D-07)
// ---------------------------------------------------------------------------

describe('MatchAnalysisService.submit — within-set duplicate link', () => {
  it('throws StructuredConflictError naming the duplicate link before any write', async () => {
    const mocks = makeMocks();
    mocks.matchRepo.findOne.mockResolvedValue(MATCH_NO_GAMES);
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    mocks.seasonPokemonRepo.find.mockResolvedValue([{ id: SP_1 }]);

    const service = buildService(mocks);
    const dto = makeDto({
      games: [
        makeGameInput({ gameNumber: 1, replayLink: REPLAY_URL_1 }),
        makeGameInput({ gameNumber: 2, replayLink: REPLAY_URL_1 }), // duplicate
      ],
    });

    await expect(service.submit(LEAGUE_ID, dto)).rejects.toBeInstanceOf(StructuredConflictError);

    let thrown: StructuredConflictError | null = null;
    try {
      await service.submit(LEAGUE_ID, dto);
    } catch (e) {
      thrown = e as StructuredConflictError;
    }

    expect(thrown).not.toBeNull();
    expect((thrown!.detail as any).duplicateLinks).toContain(REPLAY_URL_1);

    // No writes occurred
    expect(AppDataSource.transaction).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Cross-match duplicate link — 23505 constraint violation (SUB-02, D-07)
// ---------------------------------------------------------------------------

describe('MatchAnalysisService.submit — cross-match duplicate link (23505)', () => {
  it('maps 23505 from manager.save to StructuredConflictError naming the link', async () => {
    const mocks = makeMocks();
    mocks.matchRepo.findOne.mockResolvedValue(MATCH_NO_GAMES);
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    mocks.seasonPokemonRepo.find.mockResolvedValue([{ id: SP_1 }]);

    // Simulate DB unique violation on the first game save
    mockManagerGameRepo.save.mockRejectedValueOnce(
      Object.assign(new Error('duplicate key value violates unique constraint'), { code: '23505' }),
    );

    const service = buildService(mocks);
    const dto = makeDto();

    let thrown: StructuredConflictError | null = null;
    try {
      await service.submit(LEAGUE_ID, dto);
    } catch (e) {
      thrown = e as StructuredConflictError;
    }

    expect(thrown).toBeInstanceOf(StructuredConflictError);
    expect((thrown!.detail as any).duplicateLinks).toContain(REPLAY_URL_1);
  });

  it('maps "duplicate" in error message to StructuredConflictError', async () => {
    const mocks = makeMocks();
    mocks.matchRepo.findOne.mockResolvedValue(MATCH_NO_GAMES);
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    mocks.seasonPokemonRepo.find.mockResolvedValue([{ id: SP_1 }]);

    // Simulate duplicate error without code (message-based)
    mockManagerGameRepo.save.mockRejectedValueOnce(
      new Error('duplicate entry for replay_link'),
    );

    const service = buildService(mocks);
    const dto = makeDto();

    await expect(service.submit(LEAGUE_ID, dto)).rejects.toBeInstanceOf(StructuredConflictError);
  });

  it('re-throws non-duplicate errors', async () => {
    const mocks = makeMocks();
    mocks.matchRepo.findOne.mockResolvedValue(MATCH_NO_GAMES);
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    mocks.seasonPokemonRepo.find.mockResolvedValue([{ id: SP_1 }]);

    // Simulate a non-duplicate DB error
    mockManagerGameRepo.save.mockRejectedValueOnce(
      Object.assign(new Error('connection timeout'), { code: '08001' }),
    );

    const service = buildService(mocks);
    const dto = makeDto();

    await expect(service.submit(LEAGUE_ID, dto)).rejects.toThrow('connection timeout');
  });
});

// ---------------------------------------------------------------------------
// Overwrite needed — confirmOverwrite: false (SUB-03, D-02)
// ---------------------------------------------------------------------------

describe('MatchAnalysisService.submit — overwrite needed', () => {
  const EXISTING_GAME = {
    id: 500,
    matchId: MATCH_ID,
    gameNumber: 1,
    replayLink: REPLAY_URL_1,
    winningTeamId: TEAM_A_ID,
    losingTeamId: TEAM_B_ID,
    differential: 2,
    gameStats: [
      {
        id: 600,
        gameId: 500,
        seasonPokemonId: SP_1,
        directKills: 1,
        indirectKills: 0,
        deaths: 1,
      },
    ],
  };

  const MATCH_WITH_GAMES = {
    ...MATCH_NO_GAMES,
    games: [{ id: EXISTING_GAME.id }],
  };

  it('throws StructuredConflictError with detail.existingGames when confirmOverwrite is false', async () => {
    const mocks = makeMocks();
    mocks.matchRepo.findOne.mockResolvedValue(MATCH_WITH_GAMES);
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    mocks.seasonPokemonRepo.find.mockResolvedValue([{ id: SP_1 }]);

    // Mock gameRepo.createQueryBuilder for existing games with stats
    const mockQb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([EXISTING_GAME]),
    };
    mocks.gameRepo.createQueryBuilder.mockReturnValue(mockQb);

    const service = buildService(mocks);
    const dto = makeDto({ confirmOverwrite: false });

    let thrown: StructuredConflictError | null = null;
    try {
      await service.submit(LEAGUE_ID, dto);
    } catch (e) {
      thrown = e as StructuredConflictError;
    }

    expect(thrown).toBeInstanceOf(StructuredConflictError);
    const detail = thrown!.detail as any;
    expect(detail.existingGames).toHaveLength(1);
    expect(detail.existingGames[0].id).toBe(EXISTING_GAME.id);
    expect(detail.existingGames[0].stats).toHaveLength(1);
    expect(detail.existingGames[0].stats[0].seasonPokemonId).toBe(SP_1);

    // No writes should have occurred
    expect(AppDataSource.transaction).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Overwrite confirmed — confirmOverwrite: true (SUB-03, D-03)
// ---------------------------------------------------------------------------

describe('MatchAnalysisService.submit — overwrite confirmed', () => {
  const EXISTING_GAME_ID = 500;
  const MATCH_WITH_GAMES = {
    ...MATCH_NO_GAMES,
    games: [{ id: EXISTING_GAME_ID }],
  };

  it('deletes game_stat BEFORE game rows then writes fresh records inside one transaction', async () => {
    const mocks = makeMocks();
    mocks.matchRepo.findOne.mockResolvedValue(MATCH_WITH_GAMES);
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    mocks.seasonPokemonRepo.find.mockResolvedValue([{ id: SP_1 }]);

    const service = buildService(mocks);
    const dto = makeDto({ confirmOverwrite: true });

    const callOrder: string[] = [];
    mockManagerGameStatRepo.delete.mockImplementation(async () => {
      callOrder.push('delete-game-stat');
      return { affected: 1 };
    });
    mockManagerGameRepo.delete.mockImplementation(async () => {
      callOrder.push('delete-game');
      return { affected: 1 };
    });
    mockManagerMatchRepo.update.mockImplementation(async (id: any, data: any) => {
      if (data.winningTeamId === null) {
        callOrder.push('reset-match');
      } else {
        callOrder.push('set-match-winner');
      }
      return { affected: 1 };
    });
    mockManagerGameRepo.create.mockImplementation((data: any) => ({ ...data }));
    mockManagerGameRepo.save.mockImplementation(async (game: any) => {
      callOrder.push('save-game');
      return { ...game, id: 999 };
    });
    mockManagerGameStatRepo.create.mockImplementation((data: any) => ({ ...data }));
    mockManagerGameStatRepo.save.mockImplementation(async (stat: any) => {
      callOrder.push('save-stat');
      return { ...stat, id: 888 };
    });

    const result = await service.submit(LEAGUE_ID, dto);

    expect(result.matchId).toBe(MATCH_ID);
    expect(result.games).toHaveLength(2);

    // Verify deletion order: game_stat BEFORE game
    const deleteStatIdx = callOrder.indexOf('delete-game-stat');
    const deleteGameIdx = callOrder.indexOf('delete-game');
    const resetMatchIdx = callOrder.indexOf('reset-match');
    const saveGameIdx = callOrder.indexOf('save-game');

    expect(deleteStatIdx).toBeGreaterThanOrEqual(0);
    expect(deleteGameIdx).toBeGreaterThan(deleteStatIdx);
    expect(resetMatchIdx).toBeGreaterThan(deleteGameIdx);
    expect(saveGameIdx).toBeGreaterThan(resetMatchIdx);

    // Verify game_stat delete used existingGameIds
    expect(mockManagerGameStatRepo.delete).toHaveBeenCalledWith(
      expect.objectContaining({ gameId: expect.anything() }),
    );
    // Verify game delete used matchId
    expect(mockManagerGameRepo.delete).toHaveBeenCalledWith({ matchId: MATCH_ID });
  });
});

// ---------------------------------------------------------------------------
// Re-validation failures (SUB-04, D-04, D-05)
// ---------------------------------------------------------------------------

describe('MatchAnalysisService.submit — re-validation failures', () => {
  it('throws NotFoundError when matchId does not exist in DB', async () => {
    const mocks = makeMocks();
    mocks.matchRepo.findOne.mockResolvedValue(null);
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    mocks.seasonPokemonRepo.find.mockResolvedValue([]);

    const service = buildService(mocks);

    await expect(service.submit(LEAGUE_ID, makeDto())).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws ValidationError when match does not belong to submitted seasonId', async () => {
    const mocks = makeMocks();
    mocks.matchRepo.findOne.mockResolvedValue({
      ...MATCH_NO_GAMES,
      week: { ...WEEK_1, seasonId: 999 }, // different season
    });
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    mocks.seasonPokemonRepo.find.mockResolvedValue([]);

    const service = buildService(mocks);

    await expect(service.submit(LEAGUE_ID, makeDto())).rejects.toBeInstanceOf(ValidationError);
  });

  it('throws ForbiddenError when the season belongs to a different league (cross-league write)', async () => {
    const mocks = makeMocks();
    mocks.matchRepo.findOne.mockResolvedValue(MATCH_NO_GAMES);
    // Season exists and matches the body seasonId, but belongs to another league.
    mocks.seasonRepo.findOne.mockResolvedValue({ ...SEASON, leagueId: LEAGUE_ID + 1 });
    mocks.seasonPokemonRepo.find.mockResolvedValue([{ id: SP_1 }, { id: SP_2 }]);

    const service = buildService(mocks);

    await expect(service.submit(LEAGUE_ID, makeDto())).rejects.toBeInstanceOf(ForbiddenError);
    // The destructive write must never start for a cross-league attempt.
    expect(AppDataSource.transaction).not.toHaveBeenCalled();
  });

  it('throws ValidationError when winningTeamId is not a participant team', async () => {
    const mocks = makeMocks();
    mocks.matchRepo.findOne.mockResolvedValue(MATCH_NO_GAMES);
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    mocks.seasonPokemonRepo.find.mockResolvedValue([{ id: SP_1 }]);

    const service = buildService(mocks);
    const dto = makeDto({
      games: [makeGameInput({ winningTeamId: 9999 })], // not in match.teams
    });

    await expect(service.submit(LEAGUE_ID, dto)).rejects.toBeInstanceOf(ValidationError);
  });

  it('throws ValidationError when losingTeamId is not a participant team', async () => {
    const mocks = makeMocks();
    mocks.matchRepo.findOne.mockResolvedValue(MATCH_NO_GAMES);
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    mocks.seasonPokemonRepo.find.mockResolvedValue([{ id: SP_1 }]);

    const service = buildService(mocks);
    const dto = makeDto({
      games: [makeGameInput({ losingTeamId: 9999 })],
    });

    await expect(service.submit(LEAGUE_ID, dto)).rejects.toBeInstanceOf(ValidationError);
  });

  it('throws NotFoundError when seasonPokemonId is not in the season pool', async () => {
    const mocks = makeMocks();
    mocks.matchRepo.findOne.mockResolvedValue(MATCH_NO_GAMES);
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    mocks.seasonPokemonRepo.find.mockResolvedValue([]); // empty pool

    const service = buildService(mocks);

    await expect(service.submit(LEAGUE_ID, makeDto())).rejects.toBeInstanceOf(NotFoundError);
  });

  it('never calls fetcherService or parserService on re-validation failure', async () => {
    const mocks = makeMocks();
    mocks.matchRepo.findOne.mockResolvedValue(null);

    const service = buildService(mocks);

    await expect(service.submit(LEAGUE_ID, makeDto())).rejects.toThrow();
    expect(mocks.fetcherService.fetchReplay).not.toHaveBeenCalled();
    expect(mocks.parserService.parse).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Structural sanity checks (D-06)
// ---------------------------------------------------------------------------

describe('MatchAnalysisService.submit — structural sanity checks', () => {
  function setupBasicMocks(mocks: ReturnType<typeof makeMocks>) {
    mocks.matchRepo.findOne.mockResolvedValue(MATCH_NO_GAMES);
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    mocks.seasonPokemonRepo.find.mockResolvedValue([{ id: SP_1 }, { id: SP_2 }]);
  }

  it('throws ValidationError when winningTeamId === losingTeamId', async () => {
    const mocks = makeMocks();
    setupBasicMocks(mocks);

    const service = buildService(mocks);
    const dto = makeDto({
      games: [
        makeGameInput({ winningTeamId: TEAM_A_ID, losingTeamId: TEAM_A_ID }), // same team
      ],
    });

    await expect(service.submit(LEAGUE_ID, dto)).rejects.toBeInstanceOf(ValidationError);
  });

  it('throws ValidationError when differential < 0', async () => {
    const mocks = makeMocks();
    setupBasicMocks(mocks);

    const service = buildService(mocks);
    const dto = makeDto({
      games: [makeGameInput({ differential: -1 })],
    });

    await expect(service.submit(LEAGUE_ID, dto)).rejects.toBeInstanceOf(ValidationError);
  });

  it('throws ValidationError when gameNumber is out of 1..numberOfGames range (0)', async () => {
    const mocks = makeMocks();
    setupBasicMocks(mocks);

    const service = buildService(mocks);
    const dto = makeDto({
      games: [makeGameInput({ gameNumber: 0 })],
    });

    await expect(service.submit(LEAGUE_ID, dto)).rejects.toBeInstanceOf(ValidationError);
  });

  it('throws ValidationError when gameNumber is out of 1..numberOfGames range (too high)', async () => {
    const mocks = makeMocks();
    setupBasicMocks(mocks);

    const service = buildService(mocks);
    const dto = makeDto({
      games: [makeGameInput({ gameNumber: 4 })], // numberOfGames is 3
    });

    await expect(service.submit(LEAGUE_ID, dto)).rejects.toBeInstanceOf(ValidationError);
  });

  it('throws ValidationError when computed match winner is not one of the two teams', async () => {
    const mocks = makeMocks();
    setupBasicMocks(mocks);

    const service = buildService(mocks);

    // 1 game each = no majority winner, so the winner computation fails
    const dto = makeDto({
      games: [
        makeGameInput({
          gameNumber: 1,
          replayLink: REPLAY_URL_1,
          winningTeamId: TEAM_A_ID,
          losingTeamId: TEAM_B_ID,
        }),
        makeGameInput({
          gameNumber: 2,
          replayLink: REPLAY_URL_2,
          winningTeamId: TEAM_B_ID,
          losingTeamId: TEAM_A_ID,
        }),
        // Need game 3 to break the 1-1 tie — but no game 3 with stats
        // instead: submit a 2-game tie to trigger match winner not found
      ],
    });

    await expect(service.submit(LEAGUE_ID, dto)).rejects.toBeInstanceOf(ValidationError);
  });
});
