import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { Request } from 'express';
import { getQueryIntArray } from './request.utils';
import { SortOptions } from './pagination.utils';

const ALLOWED_SORT_FIELDS = new Set([
  'id', 'name', 'dexId', 'baseStatTotal', 'hp', 'attack', 'defense',
  'specialAttack', 'specialDefense', 'speed', 'pointValue', 'height', 'weight',
  'createdAt', 'updatedAt'
]);

/**
 * Apply relations (joins) to the query builder
 */
export function applyPokemonRelations<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  relations: Record<string, boolean>,
  tableName: string,
): SelectQueryBuilder<T> {
  Object.keys(relations).forEach((relation) => {
    queryBuilder = queryBuilder.leftJoinAndSelect(`${tableName}.${relation}`, relation);
  });
  return queryBuilder;
}

/**
 * Apply name ILIKE filter
 */
export function applyPokemonNameFilter<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  req: Request
): SelectQueryBuilder<T> {
  if (req.query.nameLike) {
    queryBuilder = queryBuilder.andWhere('pokemon.name ILIKE :nameLike', {
      nameLike: `%${req.query.nameLike}%`,
    });
  }
  return queryBuilder;
}

/**
 * Apply stat range filters (hp, attack, defense, etc.)
 */
export function applyPokemonStatRangeFilters<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  req: Request
): SelectQueryBuilder<T> {
  const statFieldsMap: { [key: string]: string } = {
    hp: 'pokemon.hp',
    attack: 'pokemon.attack',
    defense: 'pokemon.defense',
    specialAttack: 'pokemon.special_attack',
    specialDefense: 'pokemon.special_defense',
    speed: 'pokemon.speed',
    baseStatTotal: 'pokemon.base_stat_total',
    pointValue: 'seasonPokemon.point_value'
  };

  for (const [field, dbColumn] of Object.entries(statFieldsMap)) {
    const minParam = `min${field.charAt(0).toUpperCase() + field.slice(1)}`;
    const maxParam = `max${field.charAt(0).toUpperCase() + field.slice(1)}`;

    if (req.query[minParam]) {
      const minValue = parseInt(req.query[minParam] as string);
      if (!isNaN(minValue)) {
        queryBuilder = queryBuilder.andWhere(`${dbColumn} >= :${minParam}`, {
          [minParam]: minValue,
        });
      }
    }

    if (req.query[maxParam]) {
      const maxValue = parseInt(req.query[maxParam] as string);
      if (!isNaN(maxValue)) {
        queryBuilder = queryBuilder.andWhere(`${dbColumn} <= :${maxParam}`, {
          [maxParam]: maxValue,
        });
      }
    }
  }

  return queryBuilder;
}

/**
 * Apply bulk filters (physical and special bulk calculations)
 */
export function applyPokemonBulkFilters<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  req: Request
): SelectQueryBuilder<T> {
  if (req.query.minPhysicalBulk) {
    const minPhysicalBulk = parseInt(req.query.minPhysicalBulk as string);
    if (!isNaN(minPhysicalBulk)) {
      queryBuilder = queryBuilder.andWhere('(pokemon.hp + pokemon.defense) >= :minPhysicalBulk', {
        minPhysicalBulk,
      });
    }
  }

  if (req.query.maxPhysicalBulk) {
    const maxPhysicalBulk = parseInt(req.query.maxPhysicalBulk as string);
    if (!isNaN(maxPhysicalBulk)) {
      queryBuilder = queryBuilder.andWhere('(pokemon.hp + pokemon.defense) <= :maxPhysicalBulk', {
        maxPhysicalBulk,
      });
    }
  }

  // Special bulk filter (hp + specialDefense)
  if (req.query.minSpecialBulk) {
    const minSpecialBulk = parseInt(req.query.minSpecialBulk as string);
    if (!isNaN(minSpecialBulk)) {
      queryBuilder = queryBuilder.andWhere(
        '(pokemon.hp + pokemon.special_defense) >= :minSpecialBulk',
        { minSpecialBulk },
      );
    }
  }

  if (req.query.maxSpecialBulk) {
    const maxSpecialBulk = parseInt(req.query.maxSpecialBulk as string);
    if (!isNaN(maxSpecialBulk)) {
      queryBuilder = queryBuilder.andWhere(
        '(pokemon.hp + pokemon.special_defense) <= :maxSpecialBulk',
        { maxSpecialBulk },
      );
    }
  }

  return queryBuilder;
}

/**
 * Apply Pokemon type IDs filter (must have ALL specified types)
 */
export function applyPokemonTypeFilter<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  req: Request
): SelectQueryBuilder<T> {
  if (req.query.pokemonTypeIds) {
    const typeIdNumbers = getQueryIntArray(req, 'pokemonTypeIds');

    if (typeIdNumbers.length > 0) {
      for (let i = 0; i < typeIdNumbers.length; i++) {
        queryBuilder = queryBuilder.andWhere(
          `EXISTS (
            SELECT 1 FROM pokemon_pokemon_types ppt
            WHERE ppt.pokemon_id = pokemon.id
            AND ppt.pokemon_type_id = :typeId${i}
          )`,
          { [`typeId${i}`]: typeIdNumbers[i] },
        );
      }
    }
  }

  return queryBuilder;
}

/**
 * Apply ability IDs filter (must have ALL specified abilities)
 */
export function applyPokemonAbilityFilter<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  req: Request
): SelectQueryBuilder<T> {
  if (req.query.abilityIds) {
    const abilityIdNumbers = getQueryIntArray(req, 'abilityIds');

    if (abilityIdNumbers.length > 0) {
      for (let i = 0; i < abilityIdNumbers.length; i++) {
        queryBuilder = queryBuilder.andWhere(
          `EXISTS (
            SELECT 1 FROM pokemon_abilities pa
            WHERE pa.pokemon_id = pokemon.id
            AND pa.ability_id = :abilityId${i}
          )`,
          { [`abilityId${i}`]: abilityIdNumbers[i] },
        );
      }
    }
  }

  return queryBuilder;
}

/**
 * Apply move IDs filter (must have ALL specified moves)
 */
export function applyPokemonMoveFilter<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  req: Request
): SelectQueryBuilder<T> {
  if (req.query.moveIds) {
    const moveIdNumbers = getQueryIntArray(req, 'moveIds');

    if (moveIdNumbers.length > 0) {
      for (let i = 0; i < moveIdNumbers.length; i++) {
        queryBuilder = queryBuilder.andWhere(
          `EXISTS (
            SELECT 1 FROM pokemon_moves pm
            WHERE pm.pokemon_id = pokemon.id
            AND pm.move_id = :moveId${i}
          )`,
          { [`moveId${i}`]: moveIdNumbers[i] },
        );
      }
    }
  }

  return queryBuilder;
}

/**
 * Apply generation IDs filter (must belong to one of the specified generations)
 */
export function applyPokemonGenerationFilter<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  req: Request
): SelectQueryBuilder<T> {
  if (req.query.generationIds) {
    const generationIdNumbers = getQueryIntArray(req, 'generationIds');

    if (generationIdNumbers.length > 0) {
      queryBuilder = queryBuilder.andWhere('pokemon.generation_id IN (:...generationIds)', {
        generationIds: generationIdNumbers,
      });
    }
  }

  return queryBuilder;
}

/**
 * Apply special move category IDs filter (must have ALL specified categories)
 */
export function applyPokemonSpecialMoveCategoryFilter<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  req: Request
): SelectQueryBuilder<T> {
  if (req.query.specialMoveCategoryIds) {
    const specialMoveCategoryIdNumbers = getQueryIntArray(req, 'specialMoveCategoryIds');

    if (specialMoveCategoryIdNumbers.length > 0) {
      for (let i = 0; i < specialMoveCategoryIdNumbers.length; i++) {
        queryBuilder = queryBuilder.andWhere(
          `EXISTS (
            SELECT 1 FROM pokemon_moves pm
            INNER JOIN move_special_move_categories msmc ON pm.move_id = msmc.move_id
            WHERE pm.pokemon_id = pokemon.id
            AND msmc.special_move_category_id = :specialMoveCategoryId${i}
          )`,
          { [`specialMoveCategoryId${i}`]: specialMoveCategoryIdNumbers[i] },
        );
      }
    }
  }

  return queryBuilder;
}

/**
 * Apply weakness filter (must not be weak to ALL specified types - value <= 1)
 */
export function applyPokemonWeaknessFilter<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  req: Request
): SelectQueryBuilder<T> {
  if (req.query.weakPokemonTypeIds) {
    const weakTypeIdNumbers = getQueryIntArray(req, 'weakPokemonTypeIds');

    if (weakTypeIdNumbers.length > 0) {
      for (let i = 0; i < weakTypeIdNumbers.length; i++) {
        queryBuilder = queryBuilder.andWhere(
          `EXISTS (
            SELECT 1 FROM type_effective te
            WHERE te.pokemon_id = pokemon.id
            AND te.pokemon_type_id = :weakTypeId${i}
            AND te.value > 1
          )`,
          { [`weakTypeId${i}`]: weakTypeIdNumbers[i] },
        );
      }
    }
  }

  return queryBuilder;
}

/**
 * Apply resistance filter (must resist ALL specified types - value < 1)
 */
export function applyPokemonResistanceFilter<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  req: Request
): SelectQueryBuilder<T> {
  if (req.query.resistedPokemonTypeIds) {
    const resistedTypeIdNumbers = getQueryIntArray(req, 'resistedPokemonTypeIds');

    if (resistedTypeIdNumbers.length > 0) {
      for (let i = 0; i < resistedTypeIdNumbers.length; i++) {
        queryBuilder = queryBuilder.andWhere(
          `EXISTS (
            SELECT 1 FROM type_effective te
            WHERE te.pokemon_id = pokemon.id
            AND te.pokemon_type_id = :resistedTypeId${i}
            AND te.value < 1
          )`,
          { [`resistedTypeId${i}`]: resistedTypeIdNumbers[i] },
        );
      }
    }
  }

  return queryBuilder;
}

/**
 * Apply immunity filter (must be immune ALL specified types - value = 0)
 */
export function applyPokemonImmunityFilter<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  req: Request
): SelectQueryBuilder<T> {
  if (req.query.immunePokemonTypeIds) {
    const immuneTypeIdNumbers = getQueryIntArray(req, 'immunePokemonTypeIds');

    if (immuneTypeIdNumbers.length > 0) {
      for (let i = 0; i < immuneTypeIdNumbers.length; i++) {
        queryBuilder = queryBuilder.andWhere(
          `EXISTS (
            SELECT 1 FROM type_effective te
            WHERE te.pokemon_id = pokemon.id
            AND te.pokemon_type_id = :immuneTypeId${i}
            AND te.value = 0
          )`,
          { [`immuneTypeId${i}`]: immuneTypeIdNumbers[i] },
        );
      }
    }
  }

  return queryBuilder;
}

/**
 * Apply not weak filter (must not be weak to ALL specified types - value <= 1)
 */
export function applyPokemonNotWeakFilter<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  req: Request
): SelectQueryBuilder<T> {
  if (req.query.notWeakPokemonTypeIds) {
    const notWeakTypeIdNumbers = getQueryIntArray(req, 'notWeakPokemonTypeIds');

    if (notWeakTypeIdNumbers.length > 0) {
      for (let i = 0; i < notWeakTypeIdNumbers.length; i++) {
        queryBuilder = queryBuilder.andWhere(
          `EXISTS (
            SELECT 1 FROM type_effective te
            WHERE te.pokemon_id = pokemon.id
            AND te.pokemon_type_id = :notWeakTypeId${i}
            AND te.value <= 1
          )`,
          { [`notWeakTypeId${i}`]: notWeakTypeIdNumbers[i] },
        );
      }
    }
  }

  return queryBuilder;
}

/**
 * Apply not drafted filter (season pokemon has no season pokemon team references)
 */
export function applySeasonPokemonNotDraftedFilter<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  req: Request
): SelectQueryBuilder<T> {
  if (req.query.excludeDrafted === 'true') {
    queryBuilder = queryBuilder.andWhere(
      `NOT EXISTS (
        SELECT 1 FROM season_pokemon_team spt
        WHERE spt.season_pokemon_id = "seasonPokemon".id
      )`
    );
  }

  return queryBuilder;
}

/**
 * Apply sorting to the query
 */
export function applyPokemonSorting<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  sortOptions: SortOptions | undefined
): SelectQueryBuilder<T> {
  let tableNameVariant: 'pokemon' | 'seasonPokemon';
  if (sortOptions) {
    if (!ALLOWED_SORT_FIELDS.has(sortOptions.sortBy)) {
      throw new Error(`Invalid sort field: ${sortOptions.sortBy}`);
    }
    if (sortOptions.sortBy === 'pointValue'){
      tableNameVariant = 'seasonPokemon';
    } else {
      tableNameVariant = 'pokemon';
    }
    queryBuilder = queryBuilder.orderBy(
      `${tableNameVariant}.${sortOptions.sortBy}`,
      sortOptions.sortOrder as 'ASC' | 'DESC',
    );
  }
  return queryBuilder;
}

/**
 * Apply pagination (skip and take)
 */
export function applyPokemonPagination<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  page: number,
  pageSize: number,
): SelectQueryBuilder<T> {
  return queryBuilder.skip((page - 1) * pageSize).take(pageSize);
}
