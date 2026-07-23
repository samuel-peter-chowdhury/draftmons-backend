import { Repository, FindOptionsRelations, SelectQueryBuilder } from 'typeorm';
import { Move } from '../entities/move.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { MoveInputDto } from '../dtos/move.dto';
import { PaginatedResponse, PaginationOptions, SortOptions } from '../utils/pagination.utils';
import { hydrateRelations } from '../utils/relation-hydration.utils';
import { getQueryIntArray } from '../utils/request.utils';
import { Request } from 'express';

@Service()
export class MoveService extends BaseService<Move, MoveInputDto> {
  constructor(
    @Inject('MoveRepository')
    private MoveRepository: Repository<Move>,
  ) {
    super(MoveRepository, 'Move');
  }

  async search(
    req: Request,
    relations?: FindOptionsRelations<Move>,
    paginationOptions?: PaginationOptions,
    sortOptions?: SortOptions,
  ): Promise<PaginatedResponse<Move>> {
    const { page, pageSize } = paginationOptions ? paginationOptions : { page: 1, pageSize: 25 };

    // Phase 1: filter/sort/paginate for the page's move ids only — no hydration joins.
    let queryBuilder = this.repository.createQueryBuilder('move');
    queryBuilder = this.applyNameFilter(queryBuilder, req);
    queryBuilder = this.applyGenerationFilter(queryBuilder, req);
    queryBuilder = this.applyPokemonFilter(queryBuilder, req);
    queryBuilder = this.applySorting(queryBuilder, sortOptions);
    queryBuilder = this.applyPagination(queryBuilder, page, pageSize);

    const [rows, total] = await queryBuilder.getManyAndCount();
    const ids = rows.map((r) => r.id);

    const data = relations ? await this.hydrateMoves(ids, relations, req) : rows;

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Phase 2: hydrate the page's moves via separate, non-multiplying queries.
   *
   * Special case (option (a) from the spec): when `pokemonIds` is present, the
   * `pokemon` (learners) relation must stay scoped to just those ids — otherwise a
   * popular move's full learner pool (hundreds of rows) would ship from Postgres and
   * be discarded, working against the data-transfer goal. So we hydrate every relation
   * EXCEPT `pokemon` via `relationLoadStrategy: 'query'`, then attach the scoped
   * learners with one dedicated join query filtered to `pokemonIds`.
   */
  private async hydrateMoves(
    ids: number[],
    relations: FindOptionsRelations<Move>,
    req: Request,
  ): Promise<Move[]> {
    const pokemonIds = req.query.pokemonIds ? getQueryIntArray(req, 'pokemonIds') : [];
    const scopePokemon = relations.pokemon === true && pokemonIds.length > 0;

    const hydrationRelations: FindOptionsRelations<Move> = scopePokemon
      ? { ...relations, pokemon: false }
      : relations;

    const moves = await hydrateRelations(this.repository, ids, hydrationRelations);

    if (scopePokemon && moves.length > 0) {
      const scoped = await this.repository
        .createQueryBuilder('move')
        .leftJoinAndSelect('move.pokemon', 'pokemon', 'pokemon.id IN (:...relPokemonIds)', {
          relPokemonIds: pokemonIds,
        })
        .where('move.id IN (:...moveIds)', { moveIds: ids })
        .getMany();

      const learnersByMoveId = new Map(scoped.map((m) => [m.id, m.pokemon ?? []]));
      for (const move of moves) {
        move.pokemon = learnersByMoveId.get(move.id) ?? [];
      }
    }

    return moves;
  }

  private applyNameFilter(
    queryBuilder: SelectQueryBuilder<Move>,
    req: Request,
  ): SelectQueryBuilder<Move> {
    if (req.query.nameLike) {
      queryBuilder = queryBuilder.andWhere('move.name ILIKE :nameLike', {
        nameLike: `%${req.query.nameLike}%`,
      });
    }
    return queryBuilder;
  }

  private applyGenerationFilter(
    queryBuilder: SelectQueryBuilder<Move>,
    req: Request,
  ): SelectQueryBuilder<Move> {
    if (req.query.generationIds) {
      const generationIdNumbers = getQueryIntArray(req, 'generationIds');

      if (generationIdNumbers.length > 0) {
        queryBuilder = queryBuilder.andWhere('move.generation_id IN (:...generationIds)', {
          generationIds: generationIdNumbers,
        });
      }
    }
    return queryBuilder;
  }

  private applyPokemonFilter(
    queryBuilder: SelectQueryBuilder<Move>,
    req: Request,
  ): SelectQueryBuilder<Move> {
    if (req.query.pokemonIds) {
      const pokemonIdNumbers = getQueryIntArray(req, 'pokemonIds');

      if (pokemonIdNumbers.length > 0) {
        queryBuilder = queryBuilder.andWhere(
          `EXISTS (
            SELECT 1 FROM pokemon_moves pm
            WHERE pm.move_id = move.id
            AND pm.pokemon_id IN (:...pokemonIds)
          )`,
          { pokemonIds: pokemonIdNumbers },
        );
      }
    }

    return queryBuilder;
  }

  private static readonly ALLOWED_SORT_FIELDS = new Set([
    'id', 'name', 'power', 'accuracy', 'pp', 'priority', 'createdAt', 'updatedAt',
  ]);

  private applySorting(
    queryBuilder: SelectQueryBuilder<Move>,
    sortOptions?: SortOptions,
  ): SelectQueryBuilder<Move> {
    if (sortOptions) {
      if (!MoveService.ALLOWED_SORT_FIELDS.has(sortOptions.sortBy)) {
        throw new Error(`Invalid sort field: ${sortOptions.sortBy}`);
      }
      queryBuilder = queryBuilder.orderBy(
        `move.${sortOptions.sortBy}`,
        sortOptions.sortOrder as 'ASC' | 'DESC',
      );
    }
    return queryBuilder;
  }

  private applyPagination(
    queryBuilder: SelectQueryBuilder<Move>,
    page: number,
    pageSize: number,
  ): SelectQueryBuilder<Move> {
    const skip = (page - 1) * pageSize;
    return queryBuilder.skip(skip).take(pageSize);
  }
}
