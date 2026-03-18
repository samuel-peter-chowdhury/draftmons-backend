import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { Request } from 'express';
import { getQueryIntArray } from './request.utils';
import { SortOptions } from './pagination.utils';
import { Pokemon } from '@/entities/pokemon.entity';

const ALLOWED_SORT_FIELDS = new Set([
  'id', 'name', 'dexId', 'baseStatTotal', 'hp', 'attack', 'defense',
  'specialAttack', 'specialDefense', 'speed', 'height', 'weight',
  'createdAt', 'updatedAt',
]);

export function applyPokemonRelations<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  relations: Record<string, boolean>,
  alias: string,
): SelectQueryBuilder<T> {
  Object.keys(relations).forEach((relation) => {
    queryBuilder = queryBuilder.leftJoinAndSelect(`${alias}.${relation}`, relation);
  });
  return queryBuilder;
}

export function applyPokemonNameFilter<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  req: Request,
  alias: string,
): SelectQueryBuilder<T> {
  if (req.query.nameLike) {
    queryBuilder = queryBuilder.andWhere(`${alias}.name ILIKE :nameLike`, {
      nameLike: `%${req.query.nameLike}%`,
    });
  }
  return queryBuilder;
}

export function applyPokemonStatRangeFilters<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  req: Request,
  alias: string,
): SelectQueryBuilder<T> {
  const statFieldsMap: { [key: string]: string } = {
    hp: 'hp',
    attack: 'attack',
    defense: 'defense',
    specialAttack: 'special_attack',
    specialDefense: 'special_defense',
    speed: 'speed',
    baseStatTotal: 'base_stat_total',
    seasonPointValue: 'season_point_value'
  };

  for (const [field, dbColumn] of Object.entries(statFieldsMap)) {
    const minParam = `min${field.charAt(0).toUpperCase() + field.slice(1)}`;
    const maxParam = `max${field.charAt(0).toUpperCase() + field.slice(1)}`;

    if (req.query[minParam]) {
      const minValue = parseInt(req.query[minParam] as string);
      if (!isNaN(minValue)) {
        queryBuilder = queryBuilder.andWhere(`${alias}.${dbColumn} >= :${minParam}`, {
          [minParam]: minValue,
        });
      }
    }

    if (req.query[maxParam]) {
      const maxValue = parseInt(req.query[maxParam] as string);
      if (!isNaN(maxValue)) {
        queryBuilder = queryBuilder.andWhere(`${alias}.${dbColumn} <= :${maxParam}`, {
          [maxParam]: maxValue,
        });
      }
    }
  }

  return queryBuilder;
}

export function applyPokemonBulkFilters<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  req: Request,
  alias: string,
): SelectQueryBuilder<T> {
  if (req.query.minPhysicalBulk) {
    const minPhysicalBulk = parseInt(req.query.minPhysicalBulk as string);
    if (!isNaN(minPhysicalBulk)) {
      queryBuilder = queryBuilder.andWhere(`(${alias}.hp + ${alias}.defense) >= :minPhysicalBulk`, {
        minPhysicalBulk,
      });
    }
  }

  if (req.query.maxPhysicalBulk) {
    const maxPhysicalBulk = parseInt(req.query.maxPhysicalBulk as string);
    if (!isNaN(maxPhysicalBulk)) {
      queryBuilder = queryBuilder.andWhere(`(${alias}.hp + ${alias}.defense) <= :maxPhysicalBulk`, {
        maxPhysicalBulk,
      });
    }
  }

  if (req.query.minSpecialBulk) {
    const minSpecialBulk = parseInt(req.query.minSpecialBulk as string);
    if (!isNaN(minSpecialBulk)) {
      queryBuilder = queryBuilder.andWhere(
        `(${alias}.hp + ${alias}.special_defense) >= :minSpecialBulk`,
        { minSpecialBulk },
      );
    }
  }

  if (req.query.maxSpecialBulk) {
    const maxSpecialBulk = parseInt(req.query.maxSpecialBulk as string);
    if (!isNaN(maxSpecialBulk)) {
      queryBuilder = queryBuilder.andWhere(
        `(${alias}.hp + ${alias}.special_defense) <= :maxSpecialBulk`,
        { maxSpecialBulk },
      );
    }
  }

  return queryBuilder;
}

export function applyPokemonTypeFilter<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  req: Request,
  pokemonIdExpression: string,
): SelectQueryBuilder<T> {
  if (req.query.pokemonTypeIds) {
    const typeIdNumbers = getQueryIntArray(req, 'pokemonTypeIds');

    if (typeIdNumbers.length > 0) {
      for (let i = 0; i < typeIdNumbers.length; i++) {
        queryBuilder = queryBuilder.andWhere(
          `EXISTS (
            SELECT 1 FROM pokemon_pokemon_types ppt
            WHERE ppt.pokemon_id = ${pokemonIdExpression}
            AND ppt.pokemon_type_id = :typeId${i}
          )`,
          { [`typeId${i}`]: typeIdNumbers[i] },
        );
      }
    }
  }

  return queryBuilder;
}

export function applyPokemonAbilityFilter<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  req: Request,
  pokemonIdExpression: string,
): SelectQueryBuilder<T> {
  if (req.query.abilityIds) {
    const abilityIdNumbers = getQueryIntArray(req, 'abilityIds');

    if (abilityIdNumbers.length > 0) {
      for (let i = 0; i < abilityIdNumbers.length; i++) {
        queryBuilder = queryBuilder.andWhere(
          `EXISTS (
            SELECT 1 FROM pokemon_abilities pa
            WHERE pa.pokemon_id = ${pokemonIdExpression}
            AND pa.ability_id = :abilityId${i}
          )`,
          { [`abilityId${i}`]: abilityIdNumbers[i] },
        );
      }
    }
  }

  return queryBuilder;
}

export function applyPokemonMoveFilter<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  req: Request,
  pokemonIdExpression: string,
): SelectQueryBuilder<T> {
  if (req.query.moveIds) {
    const moveIdNumbers = getQueryIntArray(req, 'moveIds');

    if (moveIdNumbers.length > 0) {
      for (let i = 0; i < moveIdNumbers.length; i++) {
        queryBuilder = queryBuilder.andWhere(
          `EXISTS (
            SELECT 1 FROM pokemon_moves pm
            WHERE pm.pokemon_id = ${pokemonIdExpression}
            AND pm.move_id = :moveId${i}
          )`,
          { [`moveId${i}`]: moveIdNumbers[i] },
        );
      }
    }
  }

  return queryBuilder;
}

export function applyPokemonGenerationFilter<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  req: Request,
  alias: string,
): SelectQueryBuilder<T> {
  if (req.query.generationIds) {
    const generationIdNumbers = getQueryIntArray(req, 'generationIds');

    if (generationIdNumbers.length > 0) {
      queryBuilder = queryBuilder.andWhere(`${alias}.generation_id IN (:...generationIds)`, {
        generationIds: generationIdNumbers,
      });
    }
  }

  return queryBuilder;
}

export function applyPokemonSpecialMoveCategoryFilter<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  req: Request,
  pokemonIdExpression: string,
): SelectQueryBuilder<T> {
  if (req.query.specialMoveCategoryIds) {
    const specialMoveCategoryIdNumbers = getQueryIntArray(req, 'specialMoveCategoryIds');

    if (specialMoveCategoryIdNumbers.length > 0) {
      for (let i = 0; i < specialMoveCategoryIdNumbers.length; i++) {
        queryBuilder = queryBuilder.andWhere(
          `EXISTS (
            SELECT 1 FROM pokemon_moves pm
            INNER JOIN move_special_move_categories msmc ON pm.move_id = msmc.move_id
            WHERE pm.pokemon_id = ${pokemonIdExpression}
            AND msmc.special_move_category_id = :specialMoveCategoryId${i}
          )`,
          { [`specialMoveCategoryId${i}`]: specialMoveCategoryIdNumbers[i] },
        );
      }
    }
  }

  return queryBuilder;
}

export function applyPokemonWeaknessFilter<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  req: Request,
  pokemonIdExpression: string,
): SelectQueryBuilder<T> {
  if (req.query.weakPokemonTypeIds) {
    const weakTypeIdNumbers = getQueryIntArray(req, 'weakPokemonTypeIds');

    if (weakTypeIdNumbers.length > 0) {
      for (let i = 0; i < weakTypeIdNumbers.length; i++) {
        queryBuilder = queryBuilder.andWhere(
          `EXISTS (
            SELECT 1 FROM type_effective te
            WHERE te.pokemon_id = ${pokemonIdExpression}
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

export function applyPokemonResistanceFilter<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  req: Request,
  pokemonIdExpression: string,
): SelectQueryBuilder<T> {
  if (req.query.resistedPokemonTypeIds) {
    const resistedTypeIdNumbers = getQueryIntArray(req, 'resistedPokemonTypeIds');

    if (resistedTypeIdNumbers.length > 0) {
      for (let i = 0; i < resistedTypeIdNumbers.length; i++) {
        queryBuilder = queryBuilder.andWhere(
          `EXISTS (
            SELECT 1 FROM type_effective te
            WHERE te.pokemon_id = ${pokemonIdExpression}
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

export function applyPokemonImmunityFilter<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  req: Request,
  pokemonIdExpression: string,
): SelectQueryBuilder<T> {
  if (req.query.immunePokemonTypeIds) {
    const immuneTypeIdNumbers = getQueryIntArray(req, 'immunePokemonTypeIds');

    if (immuneTypeIdNumbers.length > 0) {
      for (let i = 0; i < immuneTypeIdNumbers.length; i++) {
        queryBuilder = queryBuilder.andWhere(
          `EXISTS (
            SELECT 1 FROM type_effective te
            WHERE te.pokemon_id = ${pokemonIdExpression}
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

export function applyPokemonNotWeakFilter<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  req: Request,
  pokemonIdExpression: string,
): SelectQueryBuilder<T> {
  if (req.query.notWeakPokemonTypeIds) {
    const notWeakTypeIdNumbers = getQueryIntArray(req, 'notWeakPokemonTypeIds');

    if (notWeakTypeIdNumbers.length > 0) {
      for (let i = 0; i < notWeakTypeIdNumbers.length; i++) {
        queryBuilder = queryBuilder.andWhere(
          `EXISTS (
            SELECT 1 FROM type_effective te
            WHERE te.pokemon_id = ${pokemonIdExpression}
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

export function applySeasonPokemonDraftedFilter<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  req: Request,
  pokemonIdExpression: string,
): SelectQueryBuilder<T> {
  if (req.query.pokemonTypeIds) {
    const typeIdNumbers = getQueryIntArray(req, 'pokemonTypeIds');

    if (typeIdNumbers.length > 0) {
      for (let i = 0; i < typeIdNumbers.length; i++) {
        queryBuilder = queryBuilder.andWhere(
          `EXISTS (
            SELECT 1 FROM pokemon_pokemon_types ppt
            WHERE ppt.pokemon_id = ${pokemonIdExpression}
            AND ppt.pokemon_type_id = :typeId${i}
          )`,
          { [`typeId${i}`]: typeIdNumbers[i] },
        );
      }
    }
  }

  return queryBuilder;
}

export function applyPokemonSorting<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  sortOptions: SortOptions | undefined,
  alias: string,
): SelectQueryBuilder<T> {
  if (sortOptions) {
    if (!ALLOWED_SORT_FIELDS.has(sortOptions.sortBy)) {
      throw new Error(`Invalid sort field: ${sortOptions.sortBy}`);
    }
    queryBuilder = queryBuilder.orderBy(
      `${alias}.${sortOptions.sortBy}`,
      sortOptions.sortOrder as 'ASC' | 'DESC',
    );
  }
  return queryBuilder;
}

export function applyPokemonPagination<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  page: number,
  pageSize: number,
): SelectQueryBuilder<T> {
  return queryBuilder.skip((page - 1) * pageSize).take(pageSize);
}
