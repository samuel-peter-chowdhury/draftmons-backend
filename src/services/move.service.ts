import { Repository, FindOptionsRelations, SelectQueryBuilder } from 'typeorm';
import { Move } from '../entities/move.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { MoveInputDto } from '../dtos/move.dto';
import { PaginatedResponse, PaginationOptions, SortOptions } from '../utils/pagination.utils';
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

    let queryBuilder = this.repository.createQueryBuilder('move');

    queryBuilder = this.applyRelations(queryBuilder, relations);
    queryBuilder = this.applyNameFilter(queryBuilder, req);
    queryBuilder = this.applyGenerationFilter(queryBuilder, req);
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

  private applyRelations(
    queryBuilder: SelectQueryBuilder<Move>,
    relations?: FindOptionsRelations<Move>,
  ): SelectQueryBuilder<Move> {
    if (relations) {
      Object.keys(relations).forEach((relation) => {
        queryBuilder = queryBuilder.leftJoinAndSelect(`move.${relation}`, relation);
      });
    }
    return queryBuilder;
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
