import { Repository, FindOptionsRelations, SelectQueryBuilder } from 'typeorm';
import { Pokemon } from '../entities/pokemon.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { PokemonInputDto } from '../dtos/pokemon.dto';
import { PaginatedResponse, PaginationOptions, SortOptions } from '../utils/pagination.utils';
import {
  PokemonSearchFilters,
  applyPokemonSearchFilters,
  applySearchSorting,
  applySearchPagination,
  POKEMON_SORT_FIELD_MAP,
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
    filters: PokemonSearchFilters,
    relations?: FindOptionsRelations<Pokemon>,
    paginationOptions?: PaginationOptions,
    sortOptions?: SortOptions,
  ): Promise<PaginatedResponse<Pokemon>> {
    const { page, pageSize } = paginationOptions ?? { page: 1, pageSize: 25 };

    let qb = this.repository.createQueryBuilder('pokemon');

    if (relations) {
      qb = this.applyRelations(qb, relations);
    }

    qb = applyPokemonSearchFilters(qb, filters);
    qb = applySearchSorting(qb, sortOptions, POKEMON_SORT_FIELD_MAP);
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
}
