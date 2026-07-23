import { Repository, FindOptionsRelations, FindOptionsWhere } from 'typeorm';
import { Pokemon } from '../entities/pokemon.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { PokemonInputDto } from '../dtos/pokemon.dto';
import { deleteOwnedBlob } from '../utils/blob.utils';
import { PaginatedResponse, PaginationOptions, SortOptions } from '../utils/pagination.utils';
import { hydrateRelations } from '../utils/relation-hydration.utils';
import { invalidate, pokemonDexInvalidationPrefix } from '../utils/cache.utils';
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

  async create(data: PokemonInputDto): Promise<Pokemon> {
    const created = await super.create(data);
    await invalidate(pokemonDexInvalidationPrefix(created.generationId));
    return created;
  }

  async update(
    where: FindOptionsWhere<Pokemon>,
    data: Partial<PokemonInputDto>,
    relations?: FindOptionsRelations<Pokemon>,
  ): Promise<Pokemon> {
    const existing = await this.findOne(where);
    const updated = await super.update(where, data, relations);
    // `sprite` is a manual override URL — it may be a foreign host (e.g. the
    // Bulbagarden Starmie-Mega override) or a prior Blob upload. deleteOwnedBlob
    // only ever deletes the latter, so foreign overrides are never touched.
    if (data.sprite !== undefined && existing.sprite && existing.sprite !== updated.sprite) {
      await deleteOwnedBlob(existing.sprite);
    }
    // Invalidate the cached dex for the affected generation(s). If generationId changed,
    // both the old and new generation's dex are now stale.
    await invalidate(pokemonDexInvalidationPrefix(existing.generationId));
    if (updated.generationId !== existing.generationId) {
      await invalidate(pokemonDexInvalidationPrefix(updated.generationId));
    }
    return updated;
  }

  async delete(where: FindOptionsWhere<Pokemon>): Promise<boolean> {
    const existing = await this.findOne(where);
    const result = await super.delete(where);
    await invalidate(pokemonDexInvalidationPrefix(existing.generationId));
    return result;
  }

  async search(
    filters: PokemonSearchFilters,
    relations?: FindOptionsRelations<Pokemon>,
    paginationOptions?: PaginationOptions,
    sortOptions?: SortOptions,
  ): Promise<PaginatedResponse<Pokemon>> {
    const { page, pageSize } = paginationOptions ?? { page: 1, pageSize: 25 };

    // Phase 1: select just the page's ids (+ total) with all filters/sort/pagination
    // applied. No hydration joins here — those cause the Cartesian-product row blow-up
    // (moves × typeEffectiveness × types × abilities) that drives Neon data-transfer.
    let qb = this.repository.createQueryBuilder('pokemon');
    qb = applyPokemonSearchFilters(qb, filters);
    qb = applySearchSorting(qb, sortOptions, POKEMON_SORT_FIELD_MAP);
    qb = applySearchPagination(qb, page, pageSize);

    const [rows, total] = await qb.getManyAndCount();

    // Phase 2: hydrate the page's full relation graph via separate, non-multiplying
    // queries (relationLoadStrategy: 'query'), preserving the phase-1 sort order.
    const data = relations
      ? await hydrateRelations(this.repository, rows.map((r) => r.id), relations)
      : rows;

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
