import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Container } from 'typedi';
import { ForbiddenError, NotFoundError } from '../errors';
import { SeasonPokemonService } from './season-pokemon.service';
import {
  BulkUpsertEntryInputDto,
  BulkUpsertEntryStatus,
  BulkUpsertErrorCode,
  BulkUpsertInputDto,
} from '../dtos/season-pokemon-bulk.dto';

// ---------------------------------------------------------------------------
// Mock AppDataSource — mirrors match-analysis.submit.test.ts's pattern
// ---------------------------------------------------------------------------

const mockManagerSeasonPokemonRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockManager = {
  getRepository: jest.fn((entity: any) => {
    const name = typeof entity === 'function' ? entity.name : String(entity);
    if (name === 'SeasonPokemon') return mockManagerSeasonPokemonRepo;
    return {};
  }),
};

jest.mock('../config/database.config', () => ({
  __esModule: true,
  default: {
    transaction: jest.fn(async (cb: (manager: any) => Promise<any>) => cb(mockManager)),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AppDataSource = require('../config/database.config').default;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SEASON_ID = 1;
const LEAGUE_ID = 10;
const GENERATION_ID = 9;
const MAX_POINT_VALUE = 20;
const SEASON = {
  id: SEASON_ID,
  leagueId: LEAGUE_ID,
  generationId: GENERATION_ID,
  maxPointValue: MAX_POINT_VALUE,
};

const PIKACHU = { id: 25, name: 'Pikachu', generationId: GENERATION_ID };
const CHARIZARD = { id: 6, name: 'Charizard', generationId: GENERATION_ID };

function makeEntryInput(overrides: Partial<BulkUpsertEntryInputDto> = {}): BulkUpsertEntryInputDto {
  return Object.assign(new BulkUpsertEntryInputDto(), {
    name: 'Pikachu',
    pointValue: 10,
    ...overrides,
  });
}

function makeDto(overrides: Partial<BulkUpsertInputDto> = {}): BulkUpsertInputDto {
  return Object.assign(new BulkUpsertInputDto(), {
    seasonId: SEASON_ID,
    entries: [makeEntryInput()],
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Mock helpers — mirrors makeMocks/buildService in match-analysis.submit.test.ts
// ---------------------------------------------------------------------------

function makeChainableQueryBuilder(getOneResult: any) {
  const qb: any = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(getOneResult),
  };
  return qb;
}

function makeMocks() {
  const seasonPokemonRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
  const seasonRepo = { findOne: jest.fn() };
  const pokemonRepo = { createQueryBuilder: jest.fn() };
  return { seasonPokemonRepo, seasonRepo, pokemonRepo };
}

function buildService(mocks: ReturnType<typeof makeMocks>): SeasonPokemonService {
  Container.reset();
  Container.set('SeasonPokemonRepository', mocks.seasonPokemonRepo);
  Container.set('SeasonRepository', mocks.seasonRepo);
  Container.set('PokemonRepository', mocks.pokemonRepo);
  return new SeasonPokemonService(
    mocks.seasonPokemonRepo as any,
    mocks.seasonRepo as any,
    mocks.pokemonRepo as any,
  );
}

/** Configures pokemonRepo.createQueryBuilder() to resolve to `result` for any call. */
function mockPokemonLookup(mocks: ReturnType<typeof makeMocks>, result: any) {
  mocks.pokemonRepo.createQueryBuilder.mockImplementation(() => makeChainableQueryBuilder(result));
}

/** Configures pokemonRepo.createQueryBuilder() to resolve per-name via a lookup map. */
function mockPokemonLookupByName(mocks: ReturnType<typeof makeMocks>, byName: Record<string, any>) {
  mocks.pokemonRepo.createQueryBuilder.mockImplementation(() => {
    const qb: any = {
      where: jest.fn(function (this: any, _sql: string, params: { name: string }) {
        this._name = params.name;
        return this;
      }),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(function (this: any) {
        const key = Object.keys(byName).find(
          (k) => k.trim().toLowerCase() === String(this._name).trim().toLowerCase(),
        );
        return Promise.resolve(key !== undefined ? byName[key] : null);
      }),
    };
    return qb;
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockManagerSeasonPokemonRepo.create.mockImplementation((data: any) => ({ ...data }));
  mockManagerSeasonPokemonRepo.save.mockImplementation(async (row: any) => ({ ...row, id: row.id ?? 999 }));
  AppDataSource.transaction.mockImplementation(async (cb: (m: any) => Promise<any>) => cb(mockManager));
});

// ---------------------------------------------------------------------------
// API-01: valid entries create/update in one transaction
// ---------------------------------------------------------------------------

describe('SeasonPokemonService.bulkUpsert — API-01 happy path', () => {
  it('creates a new row for an unmatched (seasonId, pokemonId) and updates an existing one, both success, one transaction', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    mockPokemonLookupByName(mocks, { Pikachu: PIKACHU, Charizard: CHARIZARD });

    // Pikachu already exists in season_pokemon; Charizard does not.
    mockManagerSeasonPokemonRepo.findOne.mockImplementation(async ({ where }: any) => {
      if (where.pokemonId === PIKACHU.id) {
        return { id: 500, seasonId: SEASON_ID, pokemonId: PIKACHU.id, pointValue: 5 };
      }
      return null;
    });

    const service = buildService(mocks);
    const dto = makeDto({
      entries: [
        makeEntryInput({ name: 'Pikachu', pointValue: 12 }),
        makeEntryInput({ name: 'Charizard', pointValue: 15 }),
      ],
    });

    const results = await service.bulkUpsert(LEAGUE_ID, dto);

    expect(results).toHaveLength(2);
    expect(results[0].status).toBe(BulkUpsertEntryStatus.SUCCESS);
    expect(results[1].status).toBe(BulkUpsertEntryStatus.SUCCESS);

    expect(AppDataSource.transaction).toHaveBeenCalledTimes(1);

    // Update path: existing row's pointValue set + saved
    expect(mockManagerSeasonPokemonRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 500, pointValue: 12 }),
    );
    // Create path: new row created + saved
    expect(mockManagerSeasonPokemonRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ seasonId: SEASON_ID, pokemonId: CHARIZARD.id, pointValue: 15 }),
    );
  });
});

// ---------------------------------------------------------------------------
// API-02: Pokémon not found
// ---------------------------------------------------------------------------

describe('SeasonPokemonService.bulkUpsert — API-02 Pokémon not found', () => {
  it('reports failure/POKEMON_NOT_FOUND for an unresolved name without blocking a sibling valid entry', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    mockPokemonLookupByName(mocks, { Pikachu: PIKACHU });
    mockManagerSeasonPokemonRepo.findOne.mockResolvedValue(null);

    const service = buildService(mocks);
    const dto = makeDto({
      entries: [
        makeEntryInput({ name: 'Missingno', pointValue: 5 }),
        makeEntryInput({ name: 'Pikachu', pointValue: 5 }),
      ],
    });

    const results = await service.bulkUpsert(LEAGUE_ID, dto);

    expect(results).toHaveLength(2);
    expect(results[0].status).toBe(BulkUpsertEntryStatus.FAILURE);
    expect(results[0].code).toBe(BulkUpsertErrorCode.POKEMON_NOT_FOUND);
    expect(results[1].status).toBe(BulkUpsertEntryStatus.SUCCESS);

    // The valid sibling entry was still written
    expect(mockManagerSeasonPokemonRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ pokemonId: PIKACHU.id }),
    );
  });
});

// ---------------------------------------------------------------------------
// API-02: point value range
// ---------------------------------------------------------------------------

describe('SeasonPokemonService.bulkUpsert — API-02 point value range', () => {
  it('rejects out-of-range values (> maxPointValue and negative) but accepts 0 (D-04)', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    mockPokemonLookup(mocks, PIKACHU);
    mockManagerSeasonPokemonRepo.findOne.mockResolvedValue(null);

    const service = buildService(mocks);
    const dto = makeDto({
      entries: [
        makeEntryInput({ name: 'Pikachu', pointValue: MAX_POINT_VALUE + 1 }),
        makeEntryInput({ name: 'Pikachu', pointValue: -1 }),
        makeEntryInput({ name: 'Pikachu', pointValue: 0 }),
      ],
    });

    const results = await service.bulkUpsert(LEAGUE_ID, dto);

    expect(results[0].status).toBe(BulkUpsertEntryStatus.FAILURE);
    expect(results[0].code).toBe(BulkUpsertErrorCode.INVALID_POINT_VALUE);
    expect(results[1].status).toBe(BulkUpsertEntryStatus.FAILURE);
    expect(results[1].code).toBe(BulkUpsertErrorCode.INVALID_POINT_VALUE);
    expect(results[2].status).toBe(BulkUpsertEntryStatus.SUCCESS);
  });
});

// ---------------------------------------------------------------------------
// D-06: blank/missing pointValue is invalid, not coerced to 0
// ---------------------------------------------------------------------------

describe('SeasonPokemonService.bulkUpsert — D-06 missing pointValue', () => {
  it('reports failure/INVALID_POINT_VALUE for an entry with pointValue undefined, without blocking others', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    mockPokemonLookup(mocks, PIKACHU);
    mockManagerSeasonPokemonRepo.findOne.mockResolvedValue(null);

    const service = buildService(mocks);
    const dto = makeDto({
      entries: [
        makeEntryInput({ name: 'Pikachu', pointValue: undefined }),
        makeEntryInput({ name: 'Pikachu', pointValue: 3 }),
      ],
    });

    const results = await service.bulkUpsert(LEAGUE_ID, dto);

    expect(results[0].status).toBe(BulkUpsertEntryStatus.FAILURE);
    expect(results[0].code).toBe(BulkUpsertErrorCode.INVALID_POINT_VALUE);
    expect(results[1].status).toBe(BulkUpsertEntryStatus.SUCCESS);
  });
});

// ---------------------------------------------------------------------------
// D-07/D-07b: duplicate names — last one wins for persistence, all valid report success
// ---------------------------------------------------------------------------

describe('SeasonPokemonService.bulkUpsert — D-07/D-07b duplicate names', () => {
  it('persists the LAST occurrence pointValue but reports every valid occurrence as success', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    mockPokemonLookup(mocks, PIKACHU);
    mockManagerSeasonPokemonRepo.findOne.mockResolvedValue(null);

    const service = buildService(mocks);
    const dto = makeDto({
      entries: [
        makeEntryInput({ name: 'Pikachu', pointValue: 5 }),
        makeEntryInput({ name: 'Pikachu', pointValue: 9 }),
      ],
    });

    const results = await service.bulkUpsert(LEAGUE_ID, dto);

    expect(results[0].status).toBe(BulkUpsertEntryStatus.SUCCESS);
    expect(results[1].status).toBe(BulkUpsertEntryStatus.SUCCESS);

    // Only ONE row written for this (seasonId, pokemonId) pair — the last value.
    expect(mockManagerSeasonPokemonRepo.create).toHaveBeenCalledTimes(1);
    expect(mockManagerSeasonPokemonRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ pokemonId: PIKACHU.id, pointValue: 9 }),
    );
  });
});

// ---------------------------------------------------------------------------
// D-10: response array parallel to request (order, length, echoed fields)
// ---------------------------------------------------------------------------

describe('SeasonPokemonService.bulkUpsert — D-10 parallel response array', () => {
  it('returns an array of the same length/order as dto.entries, echoing name and pointValue', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    mockPokemonLookupByName(mocks, { Pikachu: PIKACHU, Charizard: CHARIZARD });
    mockManagerSeasonPokemonRepo.findOne.mockResolvedValue(null);

    const service = buildService(mocks);
    const dto = makeDto({
      entries: [
        makeEntryInput({ name: 'Charizard', pointValue: 8 }),
        makeEntryInput({ name: 'Missingno', pointValue: 8 }),
        makeEntryInput({ name: ' Pikachu ', pointValue: 1 }),
      ],
    });

    const results = await service.bulkUpsert(LEAGUE_ID, dto);

    expect(results).toHaveLength(3);
    expect(results[0].name).toBe('Charizard');
    expect(results[0].pointValue).toBe(8);
    expect(results[1].name).toBe('Missingno');
    expect(results[1].pointValue).toBe(8);
    expect(results[2].name).toBe(' Pikachu ');
    expect(results[2].pointValue).toBe(1);
  });

  it('trims whitespace before resolving the Pokémon name (D-01)', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    mockPokemonLookupByName(mocks, { Pikachu: PIKACHU });
    mockManagerSeasonPokemonRepo.findOne.mockResolvedValue(null);

    const service = buildService(mocks);
    const dto = makeDto({ entries: [makeEntryInput({ name: ' Pikachu ', pointValue: 1 })] });

    const results = await service.bulkUpsert(LEAGUE_ID, dto);

    expect(results[0].status).toBe(BulkUpsertEntryStatus.SUCCESS);
  });
});

// ---------------------------------------------------------------------------
// API-03: cross-league guard
// ---------------------------------------------------------------------------

describe('SeasonPokemonService.bulkUpsert — API-03 cross-league guard', () => {
  it('throws ForbiddenError when season.leagueId !== leagueId, before opening a transaction', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue({ ...SEASON, leagueId: 999 });

    const service = buildService(mocks);
    const dto = makeDto();

    await expect(service.bulkUpsert(LEAGUE_ID, dto)).rejects.toThrow(ForbiddenError);
    expect(AppDataSource.transaction).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// season not found
// ---------------------------------------------------------------------------

describe('SeasonPokemonService.bulkUpsert — season not found', () => {
  it('throws NotFoundError when the season does not exist', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(null);

    const service = buildService(mocks);
    const dto = makeDto();

    await expect(service.bulkUpsert(LEAGUE_ID, dto)).rejects.toThrow(NotFoundError);
    expect(AppDataSource.transaction).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// CR-01: blank/null pointValue is normalized to undefined BEFORE
// class-validator runs, so validateDto() never rejects the whole request —
// the blank entry still surfaces as a per-entry INVALID_POINT_VALUE failure
// while a sibling valid entry succeeds in the same call.
// ---------------------------------------------------------------------------

describe('SeasonPokemonService.bulkUpsert — CR-01 blank pointValue normalization', () => {
  it('Test A: plainToInstance + validate() returns zero errors for pointValue: "", and normalizes it to undefined', async () => {
    const dtoObj = plainToInstance(BulkUpsertInputDto, {
      seasonId: 1,
      entries: [
        { name: 'Pikachu', pointValue: '' },
        { name: 'Charizard', pointValue: 10 },
      ],
    });

    const errors = await validate(dtoObj);

    expect(errors).toHaveLength(0);
    expect(dtoObj.entries[0].pointValue).toBeUndefined();
  });

  it('Test B: a plainToInstance-transformed blank pointValue isolates as per-entry FAILURE/INVALID_POINT_VALUE while the sibling entry still succeeds', async () => {
    const mocks = makeMocks();
    mocks.seasonRepo.findOne.mockResolvedValue(SEASON);
    mockPokemonLookupByName(mocks, { Pikachu: PIKACHU, Charizard: CHARIZARD });
    mockManagerSeasonPokemonRepo.findOne.mockResolvedValue(null);

    const dtoObj = plainToInstance(BulkUpsertInputDto, {
      seasonId: SEASON_ID,
      entries: [
        { name: 'Pikachu', pointValue: '' },
        { name: 'Charizard', pointValue: 10 },
      ],
    });

    const errors = await validate(dtoObj);
    expect(errors).toHaveLength(0);

    const service = buildService(mocks);
    const results = await service.bulkUpsert(LEAGUE_ID, dtoObj);

    expect(results).toHaveLength(2);
    expect(results[0].status).toBe(BulkUpsertEntryStatus.FAILURE);
    expect(results[0].code).toBe(BulkUpsertErrorCode.INVALID_POINT_VALUE);
    expect(results[1].status).toBe(BulkUpsertEntryStatus.SUCCESS);
  });

  it('Test C: plainToInstance + validate() also normalizes pointValue: null to undefined with zero errors', async () => {
    const dtoObj = plainToInstance(BulkUpsertInputDto, {
      seasonId: 1,
      entries: [{ name: 'Pikachu', pointValue: null }],
    });

    const errors = await validate(dtoObj);

    expect(errors).toHaveLength(0);
    expect(dtoObj.entries[0].pointValue).toBeUndefined();
  });
});
