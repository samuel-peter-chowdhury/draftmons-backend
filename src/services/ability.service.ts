import { Repository, FindOptionsRelations, SelectQueryBuilder } from 'typeorm';
import { Ability } from '../entities/ability.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { AbilityInputDto } from '../dtos/ability.dto';
import { PaginatedResponse, PaginationOptions, SortOptions } from '../utils/pagination.utils';
import { getQueryIntArray } from '../utils/request.utils';
import { Request } from 'express';

@Service()
export class AbilityService extends BaseService<Ability, AbilityInputDto> {
  constructor(
    @Inject('AbilityRepository')
    private AbilityRepository: Repository<Ability>,
  ) {
    super(AbilityRepository, 'Ability');
  }

  async search(
    req: Request,
    relations?: FindOptionsRelations<Ability>,
    paginationOptions?: PaginationOptions,
    sortOptions?: SortOptions,
  ): Promise<PaginatedResponse<Ability>> {
    const { page, pageSize } = paginationOptions ? paginationOptions : { page: 1, pageSize: 25 };

    let queryBuilder = this.repository.createQueryBuilder('ability');

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
    queryBuilder: SelectQueryBuilder<Ability>,
    relations?: FindOptionsRelations<Ability>,
  ): SelectQueryBuilder<Ability> {
    if (relations) {
      Object.keys(relations).forEach((relation) => {
        queryBuilder = queryBuilder.leftJoinAndSelect(`ability.${relation}`, relation);
      });
    }
    return queryBuilder;
  }

  private applyNameFilter(
    queryBuilder: SelectQueryBuilder<Ability>,
    req: Request,
  ): SelectQueryBuilder<Ability> {
    if (req.query.nameLike) {
      queryBuilder = queryBuilder.andWhere('ability.name ILIKE :nameLike', {
        nameLike: `%${req.query.nameLike}%`,
      });
    }
    return queryBuilder;
  }

  private applyGenerationFilter(
    queryBuilder: SelectQueryBuilder<Ability>,
    req: Request,
  ): SelectQueryBuilder<Ability> {
    if (req.query.generationIds) {
      const generationIdNumbers = getQueryIntArray(req, 'generationIds');

      if (generationIdNumbers.length > 0) {
        queryBuilder = queryBuilder.andWhere('ability.generation_id IN (:...generationIds)', {
          generationIds: generationIdNumbers,
        });
      }
    }
    return queryBuilder;
  }

  private static readonly ALLOWED_SORT_FIELDS = new Set([
    'id', 'name', 'createdAt', 'updatedAt',
  ]);

  private applySorting(
    queryBuilder: SelectQueryBuilder<Ability>,
    sortOptions?: SortOptions,
  ): SelectQueryBuilder<Ability> {
    if (sortOptions) {
      if (!AbilityService.ALLOWED_SORT_FIELDS.has(sortOptions.sortBy)) {
        throw new Error(`Invalid sort field: ${sortOptions.sortBy}`);
      }
      queryBuilder = queryBuilder.orderBy(
        `ability.${sortOptions.sortBy}`,
        sortOptions.sortOrder as 'ASC' | 'DESC',
      );
    }
    return queryBuilder;
  }

  private applyPagination(
    queryBuilder: SelectQueryBuilder<Ability>,
    page: number,
    pageSize: number,
  ): SelectQueryBuilder<Ability> {
    const skip = (page - 1) * pageSize;
    return queryBuilder.skip(skip).take(pageSize);
  }
}
