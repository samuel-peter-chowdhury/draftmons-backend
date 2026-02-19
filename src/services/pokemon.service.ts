import { Repository, FindOptionsRelations, SelectQueryBuilder } from 'typeorm';
import { Pokemon } from '../entities/pokemon.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { PokemonInputDto } from '../dtos/pokemon.dto';
import { PaginatedResponse, PaginationOptions, SortOptions } from '../utils/pagination.utils';
import { getQueryIntArray } from '../utils/request.utils';
import { Request } from 'express';

@Service()
export class PokemonService extends BaseService<Pokemon, PokemonInputDto> {
  constructor(
    @Inject('PokemonRepository')
    private pokemonRepository: Repository<Pokemon>,
  ) {
    super(pokemonRepository, 'Pokemon');
  }

  async search(
    req: Request,
    isFull: boolean,
    relations?: FindOptionsRelations<Pokemon>,
    paginationOptions?: PaginationOptions,
    sortOptions?: SortOptions,
  ): Promise<PaginatedResponse<Pokemon>> {
    const { page, pageSize } = paginationOptions ? paginationOptions : { page: 1, pageSize: 25 };

    let queryBuilder = this.repository.createQueryBuilder('pokemon');

    // Apply all filters in a logical order
    queryBuilder = this.applyRelations(queryBuilder, relations);
    queryBuilder = this.applyNameFilter(queryBuilder, req);
    queryBuilder = this.applyStatRangeFilters(queryBuilder, req);
    queryBuilder = this.applyBulkFilters(queryBuilder, req);
    queryBuilder = this.applyPokemonTypeFilter(queryBuilder, req);
    queryBuilder = this.applyAbilityFilter(queryBuilder, req);
    queryBuilder = this.applyMoveFilter(queryBuilder, req);
    queryBuilder = this.applyGenerationFilter(queryBuilder, req);
    queryBuilder = this.applySpecialMoveCategoryFilter(queryBuilder, req);
    queryBuilder = this.applyWeaknessFilter(queryBuilder, req);
    queryBuilder = this.applyResistanceFilter(queryBuilder, req);
    queryBuilder = this.applyImmunityFilter(queryBuilder, req);
    queryBuilder = this.applyNotWeakFilter(queryBuilder, req);
    queryBuilder = this.applySorting(queryBuilder, sortOptions);
    queryBuilder = this.applyPagination(queryBuilder, page, pageSize);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Apply relations (joins) to the query builder
   */
  private applyRelations(
    queryBuilder: SelectQueryBuilder<Pokemon>,
    relations?: FindOptionsRelations<Pokemon>,
  ): SelectQueryBuilder<Pokemon> {
    if (relations) {
      Object.keys(relations).forEach((relation) => {
        queryBuilder = queryBuilder.leftJoinAndSelect(`pokemon.${relation}`, relation);
      });
    }
    return queryBuilder;
  }

  /**
   * Apply name ILIKE filter
   */
  private applyNameFilter(
    queryBuilder: SelectQueryBuilder<Pokemon>,
    req: Request,
  ): SelectQueryBuilder<Pokemon> {
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
  private applyStatRangeFilters(
    queryBuilder: SelectQueryBuilder<Pokemon>,
    req: Request,
  ): SelectQueryBuilder<Pokemon> {
    const statFieldsMap: { [key: string]: string } = {
      hp: 'hp',
      attack: 'attack',
      defense: 'defense',
      specialAttack: 'special_attack',
      specialDefense: 'special_defense',
      speed: 'speed',
      baseStatTotal: 'base_stat_total',
    };

    for (const [field, dbColumn] of Object.entries(statFieldsMap)) {
      const minParam = `min${field.charAt(0).toUpperCase() + field.slice(1)}`;
      const maxParam = `max${field.charAt(0).toUpperCase() + field.slice(1)}`;

      if (req.query[minParam]) {
        const minValue = parseInt(req.query[minParam] as string);
        if (!isNaN(minValue)) {
          queryBuilder = queryBuilder.andWhere(`pokemon.${dbColumn} >= :${minParam}`, {
            [minParam]: minValue,
          });
        }
      }

      if (req.query[maxParam]) {
        const maxValue = parseInt(req.query[maxParam] as string);
        if (!isNaN(maxValue)) {
          queryBuilder = queryBuilder.andWhere(`pokemon.${dbColumn} <= :${maxParam}`, {
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
  private applyBulkFilters(
    queryBuilder: SelectQueryBuilder<Pokemon>,
    req: Request,
  ): SelectQueryBuilder<Pokemon> {
    // Physical bulk filter (hp + defense)
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
          {
            minSpecialBulk,
          },
        );
      }
    }

    if (req.query.maxSpecialBulk) {
      const maxSpecialBulk = parseInt(req.query.maxSpecialBulk as string);
      if (!isNaN(maxSpecialBulk)) {
        queryBuilder = queryBuilder.andWhere(
          '(pokemon.hp + pokemon.special_defense) <= :maxSpecialBulk',
          {
            maxSpecialBulk,
          },
        );
      }
    }

    return queryBuilder;
  }

  /**
   * Apply Pokemon type IDs filter (must have ALL specified types)
   */
  private applyPokemonTypeFilter(
    queryBuilder: SelectQueryBuilder<Pokemon>,
    req: Request,
  ): SelectQueryBuilder<Pokemon> {
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
  private applyAbilityFilter(
    queryBuilder: SelectQueryBuilder<Pokemon>,
    req: Request,
  ): SelectQueryBuilder<Pokemon> {
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
  private applyMoveFilter(
    queryBuilder: SelectQueryBuilder<Pokemon>,
    req: Request,
  ): SelectQueryBuilder<Pokemon> {
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
  private applyGenerationFilter(
    queryBuilder: SelectQueryBuilder<Pokemon>,
    req: Request,
  ): SelectQueryBuilder<Pokemon> {
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
  private applySpecialMoveCategoryFilter(
    queryBuilder: SelectQueryBuilder<Pokemon>,
    req: Request,
  ): SelectQueryBuilder<Pokemon> {
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
   * Apply weakness filter (must be weak to ALL specified types - value > 1)
   */
  private applyWeaknessFilter(
    queryBuilder: SelectQueryBuilder<Pokemon>,
    req: Request,
  ): SelectQueryBuilder<Pokemon> {
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
  private applyResistanceFilter(
    queryBuilder: SelectQueryBuilder<Pokemon>,
    req: Request,
  ): SelectQueryBuilder<Pokemon> {
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
   * Apply immunity filter (must be immune to ALL specified types - value = 0)
   */
  private applyImmunityFilter(
    queryBuilder: SelectQueryBuilder<Pokemon>,
    req: Request,
  ): SelectQueryBuilder<Pokemon> {
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
  private applyNotWeakFilter(
    queryBuilder: SelectQueryBuilder<Pokemon>,
    req: Request,
  ): SelectQueryBuilder<Pokemon> {
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

  private static readonly ALLOWED_SORT_FIELDS = new Set([
    'id', 'name', 'dexId', 'baseStatTotal', 'hp', 'attack', 'defense',
    'specialAttack', 'specialDefense', 'speed', 'height', 'weight',
    'createdAt', 'updatedAt',
  ]);

  /**
   * Apply sorting to the query
   */
  private applySorting(
    queryBuilder: SelectQueryBuilder<Pokemon>,
    sortOptions?: SortOptions,
  ): SelectQueryBuilder<Pokemon> {
    if (sortOptions) {
      if (!PokemonService.ALLOWED_SORT_FIELDS.has(sortOptions.sortBy)) {
        throw new Error(`Invalid sort field: ${sortOptions.sortBy}`);
      }
      queryBuilder = queryBuilder.orderBy(
        `pokemon.${sortOptions.sortBy}`,
        sortOptions.sortOrder as 'ASC' | 'DESC',
      );
    }

    return queryBuilder;
  }

  /**
   * Apply pagination (skip and take)
   */
  private applyPagination(
    queryBuilder: SelectQueryBuilder<Pokemon>,
    page: number,
    pageSize: number,
  ): SelectQueryBuilder<Pokemon> {
    const skip = (page - 1) * pageSize;
    return queryBuilder.skip(skip).take(pageSize);
  }
}
