import { Repository, FindOptionsOrder, FindOptionsWhere, FindOptionsRelations } from 'typeorm';
import { NotFoundError } from '../errors';
import { BaseApplicationEntity } from '../entities/base-application.entity';
import { PaginatedResponse, PaginationOptions, SortOptions } from '../utils/pagination.utils';
import { BaseInputDto } from '../dtos/base.dto';

export abstract class BaseService<E extends BaseApplicationEntity, I extends BaseInputDto> {
  protected repository: Repository<E>;
  protected entityName: string;

  constructor(repository: Repository<E>, entityName: string) {
    this.repository = repository;
    this.entityName = entityName;
  }

  async findAll(
    where?: FindOptionsWhere<E> | FindOptionsWhere<E>[],
    relations?: FindOptionsRelations<E>,
    paginationOptions?: PaginationOptions,
    sortOptions?: SortOptions,
  ): Promise<PaginatedResponse<E>> {
    const order = sortOptions ? ({ [sortOptions.sortBy]: sortOptions.sortOrder } as FindOptionsOrder<E>) : undefined;
    const { page, pageSize } = paginationOptions ? paginationOptions : { page: 1, pageSize: 25 };
    const skip = (page - 1) * pageSize;

    const [data, total] = await this.repository.findAndCount({
      where: where,
      relations: relations,
      // Load each to-many relation with a separate query instead of one giant LEFT JOIN.
      // This eliminates the Cartesian-product row amplification that drives Neon data-transfer
      // egress. It issues N extra round trips (one per to-many relation) but ships far fewer
      // rows overall — a net win for the data-transfer metric, not an N+1 regression.
      relationLoadStrategy: 'query',
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

  async findOne(where: FindOptionsWhere<E>, relations?: FindOptionsRelations<E>): Promise<E> {
    const entity = await this.repository.findOne({
      where: where,
      relations: relations,
      // See findAll(): 'query' strategy avoids Cartesian-product row amplification on to-many
      // relations (e.g. the single-Pokemon full=true detail modal drops from ~526 raw rows to
      // ~1-per-relation-query). Nested relation array order may differ from a join, which is fine.
      relationLoadStrategy: 'query',
    });

    if (!entity) {
      throw new NotFoundError(this.entityName, JSON.stringify(where));
    }

    return entity;
  }

  async create(data: I): Promise<E> {
    const entity = this.repository.create(data as any);
    return this.repository.save(entity as any);
  }

  async update(
    where: FindOptionsWhere<E>,
    data: Partial<I>,
    relations?: FindOptionsRelations<E>,
  ): Promise<E> {
    await this.findOne(where);
    await this.repository.update(where, data as any);
    return this.findOne(where, relations);
  }

  async delete(where: FindOptionsWhere<E>): Promise<boolean> {
    await this.findOne(where);
    await this.repository.delete(where);
    return true;
  }

  async findOrCreate(
    where: FindOptionsWhere<E>,
    data: I,
    relations?: FindOptionsRelations<E>,
  ): Promise<E> {
    try {
      const entity = await this.findOne(where, relations);
      return entity;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return this.create(data);
      }
      throw error;
    }
  }

  async updateOrCreate(
    where: FindOptionsWhere<E>,
    data: I,
    relations?: FindOptionsRelations<E>,
  ): Promise<E> {
    try {
      const entity = await this.update(where, data, relations);
      return entity;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return this.create(data);
      }
      throw error;
    }
  }
}
