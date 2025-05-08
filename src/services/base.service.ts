import { Repository, FindOptionsOrder } from 'typeorm';
import { NotFoundError } from '../errors';
import { BaseApplicationEntity } from '../entities/base-application-entity.entity';

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export abstract class BaseService<T extends BaseApplicationEntity> {
  protected repository: Repository<T>;
  protected entityName: string;

  constructor(repository: Repository<T>, entityName: string) {
    this.repository = repository;
    this.entityName = entityName;
  }

  async findAll(where?: any, relations?: any, pagination?: PaginationOptions, order?: FindOptionsOrder<T>): Promise<PaginatedResponse<T> | T[]> {
    if (!pagination) {
      return this.repository.find({ 
        where: where, 
        relations: relations,
        order: order
      });
    }

    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;

    const [data, total] = await this.repository.findAndCount({
      where: where,
      relations: relations,
      skip: skip,
      take: pageSize,
      order: order
    });

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number, where?: any, relations?: any): Promise<T> {
    const specific_where = { id: id, ...where } as any;
    const entity = await this.repository.findOne({
      where: specific_where,
      relations: relations
    });

    if (!entity) {
      throw new NotFoundError(this.entityName, id);
    }

    return entity;
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = this.repository.create(data as any);
    return this.repository.save(entity as any);
  }

  async update(id: number, data: Partial<T>): Promise<T> {
    await this.findOne(id);
    await this.repository.update(id, data as any);
    return this.findOne(id);
  }

  async delete(id: number): Promise<boolean> {
    await this.findOne(id);
    await this.repository.delete(id);
    return true;
  }
}
