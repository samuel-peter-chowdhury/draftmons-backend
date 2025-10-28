import { Repository, FindOptionsRelations } from 'typeorm';
import { Pokemon } from '../entities/pokemon.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { PokemonInputDto } from '../dtos/pokemon.dto';
import { PaginatedResponse, PaginationOptions, SortOptions } from '../utils/pagination.utils';
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
    const skip = (page - 1) * pageSize;

    let queryBuilder = this.repository.createQueryBuilder('pokemon');

    // Add relations to query
    if (relations) {
      if (relations.pokemonTypes) {
        queryBuilder = queryBuilder.leftJoinAndSelect('pokemon.pokemonTypes', 'pokemonTypes');
      }
      if (relations.abilities) {
        queryBuilder = queryBuilder.leftJoinAndSelect('pokemon.abilities', 'abilities');
      }
      if (isFull && relations.pokemonMoves) {
        queryBuilder = queryBuilder.leftJoinAndSelect('pokemon.pokemonMoves', 'pokemonMoves');
      }
      if (isFull && relations.typeEffectiveness) {
        queryBuilder = queryBuilder.leftJoinAndSelect('pokemon.typeEffectiveness', 'typeEffectiveness');
      }
      if (isFull && relations.seasonPokemon) {
        queryBuilder = queryBuilder.leftJoinAndSelect('pokemon.seasonPokemon', 'seasonPokemon');
      }
      if (isFull && relations.generations) {
        queryBuilder = queryBuilder.leftJoinAndSelect('pokemon.generations', 'generations');
      }
    }

    // Add where clauses
    // Name ILIKE filter
    if (req.query.nameLike) {
      queryBuilder = queryBuilder.andWhere('pokemon.name ILIKE :nameLike', {
        nameLike: `%${req.query.nameLike}%`,
      });
    }

    // Stat range filters - map camelCase to snake_case for database columns
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
        queryBuilder = queryBuilder.andWhere('(pokemon.hp + pokemon.special_defense) >= :minSpecialBulk', {
          minSpecialBulk,
        });
      }
    }

    if (req.query.maxSpecialBulk) {
      const maxSpecialBulk = parseInt(req.query.maxSpecialBulk as string);
      if (!isNaN(maxSpecialBulk)) {
        queryBuilder = queryBuilder.andWhere('(pokemon.hp + pokemon.special_defense) <= :maxSpecialBulk', {
          maxSpecialBulk,
        });
      }
    }

    // Pokemon type IDs filter (must have ALL specified types)
    if (req.query.pokemonTypeIds) {
      let typeIds = req.query.pokemonTypeIds;
      if (!Array.isArray(typeIds)) {
        typeIds = [typeIds];
      }
      const typeIdNumbers = (typeIds as string[])
        .map((id) => parseInt(id))
        .filter((id) => !isNaN(id));

      if (typeIdNumbers.length > 0) {
        // For each type ID, add a subquery to ensure the pokemon has that type
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

    // Ability IDs filter (must have ALL specified abilities)
    if (req.query.abilityIds) {
      let abilityIds = req.query.abilityIds;
      if (!Array.isArray(abilityIds)) {
        abilityIds = [abilityIds];
      }
      const abilityIdNumbers = (abilityIds as string[])
        .map((id) => parseInt(id))
        .filter((id) => !isNaN(id));

      if (abilityIdNumbers.length > 0) {
        // For each ability ID, add a subquery to ensure the pokemon has that ability
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

    // Apply sorting
    if (sortOptions) {
      queryBuilder = queryBuilder.orderBy(
        `pokemon.${sortOptions.sortBy}`,
        sortOptions.sortOrder as 'ASC' | 'DESC',
      );
    }

    queryBuilder = queryBuilder.skip(skip).take(pageSize);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
