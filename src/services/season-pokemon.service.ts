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
import { PaginatedResponse, PaginationOptions, SortOptions } from '@/utils/pagination.utils';
import { Request } from 'express';
import {
  applyPokemonNameFilter,
  applyPokemonStatRangeFilters,
  applyPokemonBulkFilters,
  applyPokemonTypeFilter,
  applyPokemonAbilityFilter,
  applyPokemonMoveFilter,
  applyPokemonGenerationFilter,
  applyPokemonSpecialMoveCategoryFilter,
  applyPokemonWeaknessFilter,
  applyPokemonResistanceFilter,
  applyPokemonImmunityFilter,
  applyPokemonNotWeakFilter,
  applyPokemonSorting,
  applyPokemonPagination,
  applySeasonPokemonNotDraftedFilter,
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
    where: Record<string, unknown>,
    req: Request,
    isFull: boolean,
    relations?: FindOptionsRelations<SeasonPokemon>,
    paginationOptions?: PaginationOptions,
    sortOptions?: SortOptions,
  ): Promise<PaginatedResponse<SeasonPokemon>> {
    const { page, pageSize } = paginationOptions ? paginationOptions : { page: 1, pageSize: 25 };

    let queryBuilder = this.repository.createQueryBuilder('seasonPokemon');

    if (relations) {
      queryBuilder = this.buildFullRelationsQb(where)
    }
    queryBuilder = applyPokemonNameFilter(queryBuilder, req);
    queryBuilder = applyPokemonStatRangeFilters(queryBuilder, req);
    queryBuilder = applyPokemonBulkFilters(queryBuilder, req);
    queryBuilder = applyPokemonTypeFilter(queryBuilder, req);
    queryBuilder = applyPokemonAbilityFilter(queryBuilder, req);
    queryBuilder = applyPokemonMoveFilter(queryBuilder, req);
    queryBuilder = applyPokemonGenerationFilter(queryBuilder, req);
    queryBuilder = applyPokemonSpecialMoveCategoryFilter(queryBuilder, req);
    queryBuilder = applyPokemonWeaknessFilter(queryBuilder, req);
    queryBuilder = applyPokemonResistanceFilter(queryBuilder, req);
    queryBuilder = applyPokemonImmunityFilter(queryBuilder, req);
    queryBuilder = applyPokemonNotWeakFilter(queryBuilder, req);
    queryBuilder = applySeasonPokemonNotDraftedFilter(queryBuilder, req);  
    queryBuilder = applyPokemonSorting(queryBuilder, sortOptions);
    queryBuilder = applyPokemonPagination(queryBuilder, page, pageSize);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findAllActiveRelations(
    where: Record<string, unknown>,
    paginationOptions?: PaginationOptions,
    sortOptions?: SortOptions,
  ): Promise<PaginatedResponse<SeasonPokemon>> {
    const { page, pageSize } = paginationOptions ?? { page: 1, pageSize: 25 };
    const skip = (page - 1) * pageSize;

    const qb = this.buildFullRelationsQb(where);
    this.applySortToQb(qb, sortOptions);
    qb.skip(skip).take(pageSize);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOneActiveRelations(where: Record<string, unknown>): Promise<SeasonPokemon> {
    const qb = this.buildFullRelationsQb(where);
    const entity = await qb.getOne();

    if (!entity) {
      throw new NotFoundError(this.entityName, JSON.stringify(where));
    }

    return entity;
  }

  private buildFullRelationsQb(
    where: Record<string, unknown>,
  ): SelectQueryBuilder<SeasonPokemon> {
    const qb = this.repository
      .createQueryBuilder('seasonPokemon')
      .leftJoinAndSelect('seasonPokemon.season', 'season')
      .leftJoinAndSelect('seasonPokemon.pokemon', 'pokemon')
      .leftJoinAndSelect('pokemon.pokemonTypes', 'pokemonType')
      .leftJoinAndSelect('pokemon.abilities', 'ability')
      .leftJoinAndSelect('pokemon.generation', 'generation')
      .leftJoinAndSelect(
        'seasonPokemon.seasonPokemonTeams',
        'seasonPokemonTeam',
        'seasonPokemonTeam.isActive = :sptActive',
        { sptActive: true },
      )
      .leftJoinAndSelect('seasonPokemon.gameStats', 'gameStat');

    if (where.id !== undefined) {
      qb.andWhere('seasonPokemon.id = :id', { id: where.id });
    }
    if (where.seasonId !== undefined) {
      qb.andWhere('seasonPokemon.seasonId = :seasonId', { seasonId: where.seasonId });
    }
    if (where.pokemonId !== undefined) {
      qb.andWhere('seasonPokemon.pokemonId = :pokemonId', { pokemonId: where.pokemonId });
    }
    if (where.teamId !== undefined) {
      qb.andWhere('seasonPokemonTeam.teamId = :teamId', { teamId: where.teamId });
    }

    return qb;
  }

  private applySortToQb(
    qb: SelectQueryBuilder<SeasonPokemon>,
    sortOptions?: SortOptions,
  ): void {
    if (!sortOptions) return;

    if (sortOptions.sortBy === 'name') {
      qb.orderBy('pokemon.name', sortOptions.sortOrder);
    } else {
      qb.orderBy(`seasonPokemon.${sortOptions.sortBy}`, sortOptions.sortOrder);
    }
  }
}
