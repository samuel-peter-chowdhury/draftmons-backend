import { Repository, FindOptionsRelations } from 'typeorm';
import { Pokemon } from '../entities/pokemon.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { PokemonInputDto } from '../dtos/pokemon.dto';
import { PaginatedResponse, PaginationOptions, SortOptions } from '../utils/pagination.utils';
import { Request } from 'express';
import {
  applyPokemonRelations,
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
      queryBuilder = applyPokemonRelations(queryBuilder, relations as Record<string, boolean>, 'pokemon');
    }
    queryBuilder = applyPokemonNameFilter(queryBuilder, req, 'pokemon');
    queryBuilder = applyPokemonStatRangeFilters(queryBuilder, req, 'pokemon');
    queryBuilder = applyPokemonBulkFilters(queryBuilder, req, 'pokemon');
    queryBuilder = applyPokemonTypeFilter(queryBuilder, req, 'pokemon.id');
    queryBuilder = applyPokemonAbilityFilter(queryBuilder, req, 'pokemon.id');
    queryBuilder = applyPokemonMoveFilter(queryBuilder, req, 'pokemon.id');
    queryBuilder = applyPokemonGenerationFilter(queryBuilder, req, 'pokemon');
    queryBuilder = applyPokemonSpecialMoveCategoryFilter(queryBuilder, req, 'pokemon.id');
    queryBuilder = applyPokemonWeaknessFilter(queryBuilder, req, 'pokemon.id');
    queryBuilder = applyPokemonResistanceFilter(queryBuilder, req, 'pokemon.id');
    queryBuilder = applyPokemonImmunityFilter(queryBuilder, req, 'pokemon.id');
    queryBuilder = applyPokemonNotWeakFilter(queryBuilder, req, 'pokemon.id');
    queryBuilder = applyPokemonSorting(queryBuilder, sortOptions, 'pokemon');
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
