import { Repository, FindOptionsRelations } from 'typeorm';
import { Pokemon } from '../entities/pokemon.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { PokemonInputDto } from '../dtos/pokemon.dto';
import { PaginatedResponse, PaginationOptions, SortOptions } from '../utils/pagination.utils';
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
} from '../utils/pokemon-search.utils';

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

    if (relations) {
      queryBuilder = applyRelations(queryBuilder, relations as Record<string, boolean>, 'pokemon');
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
