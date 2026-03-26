import { SeasonPokemon } from '../entities/season-pokemon.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { FindOptionsOrder, FindOptionsRelations, FindOptionsWhere, Repository } from 'typeorm';
import { SeasonPokemonInputDto } from '../dtos/season-pokemon.dto';
import { ConflictError } from '../errors';
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
  applyRelations,
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

  async findAll(
    where?: FindOptionsWhere<SeasonPokemon> | FindOptionsWhere<SeasonPokemon>[],
    relations?: FindOptionsRelations<SeasonPokemon>,
    paginationOptions?: PaginationOptions,
    sortOptions?: SortOptions,
  ): Promise<PaginatedResponse<SeasonPokemon>> {
    let order: FindOptionsOrder<SeasonPokemon> | undefined;
    const sortBy = sortOptions?.sortBy;
    if (sortOptions?.sortBy === 'name'){
      order = {pokemon: {name: sortOptions.sortOrder}} as FindOptionsOrder<SeasonPokemon>;
    } else {
      order = sortOptions ? ({ [sortOptions.sortBy]: sortOptions.sortOrder } as FindOptionsOrder<SeasonPokemon>) : undefined;
    }

    const { page, pageSize } = paginationOptions ? paginationOptions : { page: 1, pageSize: 25 };
    const skip = (page - 1) * pageSize;

    const [data, total] = await this.repository.findAndCount({
      where: where,
      relations: relations,
      skip: skip,
      take: pageSize,
      order: order,
    });

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } 

  async search(
    req: Request,
    isFull: boolean,
    relations?: FindOptionsRelations<SeasonPokemon>,
    paginationOptions?: PaginationOptions,
    sortOptions?: SortOptions,
  ): Promise<PaginatedResponse<SeasonPokemon>> {
    const { page, pageSize } = paginationOptions ? paginationOptions : { page: 1, pageSize: 25 };

    let queryBuilder = this.repository.createQueryBuilder('seasonPokemon');

    if (relations) {
      queryBuilder = applyRelations(queryBuilder, relations as Record<string, boolean>, 'seasonPokemon');
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
}
