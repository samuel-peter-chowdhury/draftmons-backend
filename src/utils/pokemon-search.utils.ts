import { SelectQueryBuilder } from 'typeorm';
import { Request } from 'express';
import { getQueryIntArray } from './request.utils';
import { SortOptions } from './pagination.utils';
import { BaseApplicationEntity } from '../entities/base-application.entity';

// ---------------------------------------------------------------------------
// Filter interfaces
// ---------------------------------------------------------------------------

export interface PokemonSearchFilters {
  nameLike?: string;
  minHp?: number;
  maxHp?: number;
  minAttack?: number;
  maxAttack?: number;
  minDefense?: number;
  maxDefense?: number;
  minSpecialAttack?: number;
  maxSpecialAttack?: number;
  minSpecialDefense?: number;
  maxSpecialDefense?: number;
  minSpeed?: number;
  maxSpeed?: number;
  minBaseStatTotal?: number;
  maxBaseStatTotal?: number;
  minPhysicalBulk?: number;
  maxPhysicalBulk?: number;
  minSpecialBulk?: number;
  maxSpecialBulk?: number;
  pokemonTypeIds?: number[];
  abilityIds?: number[];
  moveIds?: number[];
  generationIds?: number[];
  specialMoveCategoryIds?: number[];
  weakPokemonTypeIds?: number[];
  resistedPokemonTypeIds?: number[];
  immunePokemonTypeIds?: number[];
  notWeakPokemonTypeIds?: number[];
}

export interface SeasonPokemonSearchFilters extends PokemonSearchFilters {
  seasonId?: number;
  pokemonId?: number;
  teamId?: number;
  minPointValue?: number;
  maxPointValue?: number;
  excludeDrafted?: boolean;
}

// ---------------------------------------------------------------------------
// Sort field maps
// ---------------------------------------------------------------------------

export const POKEMON_SORT_FIELD_MAP: Record<string, string> = {
  id: 'pokemon.id',
  dexId: 'pokemon.dexId',
  name: 'pokemon.name',
  hp: 'pokemon.hp',
  attack: 'pokemon.attack',
  defense: 'pokemon.defense',
  specialAttack: 'pokemon.specialAttack',
  specialDefense: 'pokemon.specialDefense',
  speed: 'pokemon.speed',
  baseStatTotal: 'pokemon.baseStatTotal',
  height: 'pokemon.height',
  weight: 'pokemon.weight',
  createdAt: 'pokemon.createdAt',
  updatedAt: 'pokemon.updatedAt',
};

export const SEASON_POKEMON_SORT_FIELD_MAP: Record<string, string> = {
  ...POKEMON_SORT_FIELD_MAP,
  id: 'seasonPokemon.id',
  pointValue: 'seasonPokemon.pointValue',
  createdAt: 'seasonPokemon.createdAt',
  updatedAt: 'seasonPokemon.updatedAt',
};

// ---------------------------------------------------------------------------
// Parse helpers (private)
// ---------------------------------------------------------------------------

function parseOptionalInt(value: string | undefined): number | undefined {
  if (value === undefined || value === null) return undefined;
  const parsed = parseInt(value);
  return isNaN(parsed) ? undefined : parsed;
}

function parseIntArrayParam(req: Request, field: string): number[] | undefined {
  const values = getQueryIntArray(req, field);
  return values.length > 0 ? values : undefined;
}

// ---------------------------------------------------------------------------
// Parse functions
// ---------------------------------------------------------------------------

export function parsePokemonSearchFilters(req: Request): PokemonSearchFilters {
  return {
    nameLike: req.query.nameLike as string | undefined,
    minHp: parseOptionalInt(req.query.minHp as string),
    maxHp: parseOptionalInt(req.query.maxHp as string),
    minAttack: parseOptionalInt(req.query.minAttack as string),
    maxAttack: parseOptionalInt(req.query.maxAttack as string),
    minDefense: parseOptionalInt(req.query.minDefense as string),
    maxDefense: parseOptionalInt(req.query.maxDefense as string),
    minSpecialAttack: parseOptionalInt(req.query.minSpecialAttack as string),
    maxSpecialAttack: parseOptionalInt(req.query.maxSpecialAttack as string),
    minSpecialDefense: parseOptionalInt(req.query.minSpecialDefense as string),
    maxSpecialDefense: parseOptionalInt(req.query.maxSpecialDefense as string),
    minSpeed: parseOptionalInt(req.query.minSpeed as string),
    maxSpeed: parseOptionalInt(req.query.maxSpeed as string),
    minBaseStatTotal: parseOptionalInt(req.query.minBaseStatTotal as string),
    maxBaseStatTotal: parseOptionalInt(req.query.maxBaseStatTotal as string),
    minPhysicalBulk: parseOptionalInt(req.query.minPhysicalBulk as string),
    maxPhysicalBulk: parseOptionalInt(req.query.maxPhysicalBulk as string),
    minSpecialBulk: parseOptionalInt(req.query.minSpecialBulk as string),
    maxSpecialBulk: parseOptionalInt(req.query.maxSpecialBulk as string),
    pokemonTypeIds: parseIntArrayParam(req, 'pokemonTypeIds'),
    abilityIds: parseIntArrayParam(req, 'abilityIds'),
    moveIds: parseIntArrayParam(req, 'moveIds'),
    generationIds: parseIntArrayParam(req, 'generationIds'),
    specialMoveCategoryIds: parseIntArrayParam(req, 'specialMoveCategoryIds'),
    weakPokemonTypeIds: parseIntArrayParam(req, 'weakPokemonTypeIds'),
    resistedPokemonTypeIds: parseIntArrayParam(req, 'resistedPokemonTypeIds'),
    immunePokemonTypeIds: parseIntArrayParam(req, 'immunePokemonTypeIds'),
    notWeakPokemonTypeIds: parseIntArrayParam(req, 'notWeakPokemonTypeIds'),
  };
}

export function parseSeasonPokemonSearchFilters(req: Request): SeasonPokemonSearchFilters {
  return {
    ...parsePokemonSearchFilters(req),
    seasonId: parseOptionalInt(req.query.seasonId as string),
    pokemonId: parseOptionalInt(req.query.pokemonId as string),
    teamId: parseOptionalInt(req.query.teamId as string),
    minPointValue: parseOptionalInt(req.query.minPointValue as string),
    maxPointValue: parseOptionalInt(req.query.maxPointValue as string),
    excludeDrafted: req.query.excludeDrafted === 'true',
  };
}

// ---------------------------------------------------------------------------
// Atomic filter helpers (private)
// ---------------------------------------------------------------------------

function applyNameFilter<T extends BaseApplicationEntity>(
  qb: SelectQueryBuilder<T>,
  nameLike: string | undefined,
): SelectQueryBuilder<T> {
  if (nameLike) {
    qb = qb.andWhere('pokemon.name ILIKE :nameLike', { nameLike: `%${nameLike}%` });
  }
  return qb;
}

/**
 * Raw column names are required in andWhere expressions because TypeORM does
 * not resolve property names inside arithmetic / complex SQL fragments.
 * Single-word columns (hp, attack, etc.) are identical in both conventions.
 */
function applyStatRangeFilters<T extends BaseApplicationEntity>(
  qb: SelectQueryBuilder<T>,
  filters: PokemonSearchFilters,
): SelectQueryBuilder<T> {
  const statFields: [string, string, number | undefined, number | undefined][] = [
    ['Hp', 'pokemon.hp', filters.minHp, filters.maxHp],
    ['Attack', 'pokemon.attack', filters.minAttack, filters.maxAttack],
    ['Defense', 'pokemon.defense', filters.minDefense, filters.maxDefense],
    ['SpecialAttack', 'pokemon.special_attack', filters.minSpecialAttack, filters.maxSpecialAttack],
    ['SpecialDefense', 'pokemon.special_defense', filters.minSpecialDefense, filters.maxSpecialDefense],
    ['Speed', 'pokemon.speed', filters.minSpeed, filters.maxSpeed],
    ['BaseStatTotal', 'pokemon.base_stat_total', filters.minBaseStatTotal, filters.maxBaseStatTotal],
  ];

  for (const [label, column, min, max] of statFields) {
    if (min !== undefined) {
      qb = qb.andWhere(`${column} >= :min${label}`, { [`min${label}`]: min });
    }
    if (max !== undefined) {
      qb = qb.andWhere(`${column} <= :max${label}`, { [`max${label}`]: max });
    }
  }

  return qb;
}

function applyBulkFilters<T extends BaseApplicationEntity>(
  qb: SelectQueryBuilder<T>,
  filters: PokemonSearchFilters,
): SelectQueryBuilder<T> {
  if (filters.minPhysicalBulk !== undefined) {
    qb = qb.andWhere('(pokemon.hp + pokemon.defense) >= :minPhysicalBulk', {
      minPhysicalBulk: filters.minPhysicalBulk,
    });
  }
  if (filters.maxPhysicalBulk !== undefined) {
    qb = qb.andWhere('(pokemon.hp + pokemon.defense) <= :maxPhysicalBulk', {
      maxPhysicalBulk: filters.maxPhysicalBulk,
    });
  }
  if (filters.minSpecialBulk !== undefined) {
    qb = qb.andWhere('(pokemon.hp + pokemon.special_defense) >= :minSpecialBulk', {
      minSpecialBulk: filters.minSpecialBulk,
    });
  }
  if (filters.maxSpecialBulk !== undefined) {
    qb = qb.andWhere('(pokemon.hp + pokemon.special_defense) <= :maxSpecialBulk', {
      maxSpecialBulk: filters.maxSpecialBulk,
    });
  }
  return qb;
}

function applyExistsArrayFilter<T extends BaseApplicationEntity>(
  qb: SelectQueryBuilder<T>,
  ids: number[] | undefined,
  buildSql: (param: string) => string,
  paramPrefix: string,
): SelectQueryBuilder<T> {
  if (!ids) return qb;
  for (let i = 0; i < ids.length; i++) {
    const paramName = `${paramPrefix}${i}`;
    qb = qb.andWhere(buildSql(`:${paramName}`), { [paramName]: ids[i] });
  }
  return qb;
}

function applyTypeEffectivenessFilter<T extends BaseApplicationEntity>(
  qb: SelectQueryBuilder<T>,
  ids: number[] | undefined,
  valueCondition: string,
  paramPrefix: string,
): SelectQueryBuilder<T> {
  return applyExistsArrayFilter(
    qb,
    ids,
    (param) =>
      `EXISTS (
        SELECT 1 FROM type_effective te
        WHERE te.pokemon_id = pokemon.id
        AND te.pokemon_type_id = ${param}
        AND te.value ${valueCondition}
      )`,
    paramPrefix,
  );
}

// ---------------------------------------------------------------------------
// Composite filter functions
// ---------------------------------------------------------------------------

export function applyPokemonSearchFilters<T extends BaseApplicationEntity>(
  qb: SelectQueryBuilder<T>,
  filters: PokemonSearchFilters,
): SelectQueryBuilder<T> {
  qb = applyNameFilter(qb, filters.nameLike);
  qb = applyStatRangeFilters(qb, filters);
  qb = applyBulkFilters(qb, filters);

  qb = applyExistsArrayFilter(
    qb,
    filters.pokemonTypeIds,
    (param) =>
      `EXISTS (
        SELECT 1 FROM pokemon_pokemon_types ppt
        WHERE ppt.pokemon_id = pokemon.id
        AND ppt.pokemon_type_id = ${param}
      )`,
    'typeId',
  );

  qb = applyExistsArrayFilter(
    qb,
    filters.abilityIds,
    (param) =>
      `EXISTS (
        SELECT 1 FROM pokemon_abilities pa
        WHERE pa.pokemon_id = pokemon.id
        AND pa.ability_id = ${param}
      )`,
    'abilityId',
  );

  qb = applyExistsArrayFilter(
    qb,
    filters.moveIds,
    (param) =>
      `EXISTS (
        SELECT 1 FROM pokemon_moves pm
        WHERE pm.pokemon_id = pokemon.id
        AND pm.move_id = ${param}
      )`,
    'moveId',
  );

  if (filters.generationIds) {
    qb = qb.andWhere('pokemon.generation_id IN (:...generationIds)', {
      generationIds: filters.generationIds,
    });
  }

  qb = applyExistsArrayFilter(
    qb,
    filters.specialMoveCategoryIds,
    (param) =>
      `EXISTS (
        SELECT 1 FROM pokemon_moves pm
        INNER JOIN move_special_move_categories msmc ON pm.move_id = msmc.move_id
        WHERE pm.pokemon_id = pokemon.id
        AND msmc.special_move_category_id = ${param}
      )`,
    'specialMoveCategoryId',
  );

  qb = applyTypeEffectivenessFilter(qb, filters.weakPokemonTypeIds, '> 1', 'weakTypeId');
  qb = applyTypeEffectivenessFilter(qb, filters.resistedPokemonTypeIds, '< 1', 'resistedTypeId');
  qb = applyTypeEffectivenessFilter(qb, filters.immunePokemonTypeIds, '= 0', 'immuneTypeId');
  qb = applyTypeEffectivenessFilter(qb, filters.notWeakPokemonTypeIds, '<= 1', 'notWeakTypeId');

  return qb;
}

export function applySeasonPokemonSearchFilters<T extends BaseApplicationEntity>(
  qb: SelectQueryBuilder<T>,
  filters: SeasonPokemonSearchFilters,
): SelectQueryBuilder<T> {
  qb = applyPokemonSearchFilters(qb, filters);

  if (filters.seasonId !== undefined) {
    qb = qb.andWhere('seasonPokemon.seasonId = :seasonId', { seasonId: filters.seasonId });
  }
  if (filters.pokemonId !== undefined) {
    qb = qb.andWhere('seasonPokemon.pokemonId = :pokemonId', { pokemonId: filters.pokemonId });
  }
  if (filters.teamId !== undefined) {
    qb = qb.andWhere('seasonPokemonTeam.teamId = :teamId', { teamId: filters.teamId });
  }

  if (filters.minPointValue !== undefined) {
    qb = qb.andWhere('seasonPokemon.point_value >= :minPointValue', {
      minPointValue: filters.minPointValue,
    });
  }
  if (filters.maxPointValue !== undefined) {
    qb = qb.andWhere('seasonPokemon.point_value <= :maxPointValue', {
      maxPointValue: filters.maxPointValue,
    });
  }

  if (filters.excludeDrafted) {
    qb = qb.andWhere(
      `NOT EXISTS (
        SELECT 1 FROM season_pokemon_team spt
        WHERE spt.season_pokemon_id = "seasonPokemon".id
        AND spt.is_active = true
      )`,
    );
  }

  return qb;
}

// ---------------------------------------------------------------------------
// Sorting and pagination
// ---------------------------------------------------------------------------

export function applySearchSorting<T extends BaseApplicationEntity>(
  qb: SelectQueryBuilder<T>,
  sortOptions: SortOptions | undefined,
  fieldMap: Record<string, string>,
): SelectQueryBuilder<T> {
  if (!sortOptions) return qb;

  const column = fieldMap[sortOptions.sortBy];
  if (!column) {
    throw new Error(`Invalid sort field: ${sortOptions.sortBy}`);
  }

  return qb.orderBy(column, sortOptions.sortOrder as 'ASC' | 'DESC');
}

export function applySearchPagination<T extends BaseApplicationEntity>(
  qb: SelectQueryBuilder<T>,
  page: number,
  pageSize: number,
): SelectQueryBuilder<T> {
  return qb.skip((page - 1) * pageSize).take(pageSize);
}
