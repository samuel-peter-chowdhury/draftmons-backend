import { SeasonPokemon } from '../entities/season-pokemon.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import {
  FindOptionsRelations,
  FindOptionsWhere,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { SeasonPokemonInputDto } from '../dtos/season-pokemon.dto';
import { ConflictError, NotFoundError } from '../errors';
import { PaginatedResponse, PaginationOptions, SortOptions } from '../utils/pagination.utils';
import {
  SeasonPokemonSearchFilters,
  applySeasonPokemonSearchFilters,
  applySearchSorting,
  applySearchPagination,
  SEASON_POKEMON_SORT_FIELD_MAP,
} from '../utils/pokemon-search.utils';

@Service()
export class SeasonPokemonService extends BaseService<SeasonPokemon, SeasonPokemonInputDto> {
  constructor(
    @Inject('SeasonPokemonRepository')
    private SeasonPokemonRepository: Repository<SeasonPokemon>,
  ) {
    super(SeasonPokemonRepository, 'SeasonPokemon');
  }

  async delete(where: FindOptionsWhere<SeasonPokemon>): Promise<boolean> {
    const entity = await this.findOne(where, { seasonPokemonTeams: true, gameStats: true });
    const children: string[] = [];
    if (entity.seasonPokemonTeams?.length) children.push('team assignments');
    if (entity.gameStats?.length) children.push('game stats');
    if (children.length > 0) {
      throw new ConflictError(
        `Cannot delete Season Pokemon: it still has ${children.join(' and ')}. Remove them first.`,
      );
    }
    return super.delete(where);
  }

  async search(
    filters: SeasonPokemonSearchFilters,
    loadFullRelations: boolean,
    activeRelationsOnly: boolean,
    paginationOptions?: PaginationOptions,
    sortOptions?: SortOptions,
  ): Promise<PaginatedResponse<SeasonPokemon>> {
    const { page, pageSize } = paginationOptions ?? { page: 1, pageSize: 25 };

    let qb = this.buildQueryBuilder(
      loadFullRelations,
      activeRelationsOnly,
      filters.teamId !== undefined,
    );

    qb = applySeasonPokemonSearchFilters(qb, filters);
    qb = applySearchSorting(qb, sortOptions, SEASON_POKEMON_SORT_FIELD_MAP);
    qb = applySearchPagination(qb, page, pageSize);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(
    where: FindOptionsWhere<SeasonPokemon>,
    relations?: FindOptionsRelations<SeasonPokemon>,
    activeRelationsOnly?: boolean,
  ): Promise<SeasonPokemon> {
    if (!activeRelationsOnly) {
      return super.findOne(where, relations);
    }

    const qb = this.buildQueryBuilder(true, true);
    const whereRecord = where as Record<string, unknown>;

    if (whereRecord.id !== undefined) {
      qb.andWhere('seasonPokemon.id = :id', { id: whereRecord.id });
    }
    if (whereRecord.seasonId !== undefined) {
      qb.andWhere('seasonPokemon.seasonId = :seasonId', { seasonId: whereRecord.seasonId });
    }
    if (whereRecord.pokemonId !== undefined) {
      qb.andWhere('seasonPokemon.pokemonId = :pokemonId', { pokemonId: whereRecord.pokemonId });
    }

    const entity = await qb.getOne();

    if (!entity) {
      throw new NotFoundError(this.entityName, JSON.stringify(where));
    }

    return entity;
  }

  private buildQueryBuilder(
    loadFullRelations: boolean,
    activeRelationsOnly: boolean,
    needsTeamJoin?: boolean,
  ): SelectQueryBuilder<SeasonPokemon> {
    const qb = this.repository
      .createQueryBuilder('seasonPokemon')
      .leftJoinAndSelect('seasonPokemon.pokemon', 'pokemon');

    if (loadFullRelations) {
      qb.leftJoinAndSelect('seasonPokemon.season', 'season')
        .leftJoinAndSelect('pokemon.pokemonTypes', 'pokemonType')
        .leftJoinAndSelect('pokemon.abilities', 'ability')
        .leftJoinAndSelect('pokemon.generation', 'generation')
        .leftJoinAndSelect('seasonPokemon.gameStats', 'gameStat');

      if (activeRelationsOnly) {
        qb.leftJoinAndSelect(
          'seasonPokemon.seasonPokemonTeams',
          'seasonPokemonTeam',
          'seasonPokemonTeam.isActive = :sptActive',
          { sptActive: true },
        );
      } else {
        qb.leftJoinAndSelect('seasonPokemon.seasonPokemonTeams', 'seasonPokemonTeam');
      }
    } else if (needsTeamJoin) {
      if (activeRelationsOnly) {
        qb.leftJoin(
          'seasonPokemon.seasonPokemonTeams',
          'seasonPokemonTeam',
          'seasonPokemonTeam.isActive = :sptActive',
          { sptActive: true },
        );
      } else {
        qb.leftJoin('seasonPokemon.seasonPokemonTeams', 'seasonPokemonTeam');
      }
    }

    return qb;
  }
}
