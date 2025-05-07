import { Repository, FindOptionsWhere, FindManyOptions, DeepPartial } from 'typeorm';
import { BaseApplicationEntity } from '../entities/base-application-entity.entity';

export interface IBaseRepository<T extends BaseApplicationEntity> {
  findOne(id: number): Promise<T | null>;
  findOneBy(where: FindOptionsWhere<T>): Promise<T | null>;
  find(options?: FindManyOptions<T>): Promise<T[]>;
  create(data: DeepPartial<T>): T;
  save(entity: T): Promise<T>;
  update(id: number, data: DeepPartial<T>): Promise<T | null>;
  delete(id: number): Promise<boolean>;
}

export abstract class BaseRepository<T extends BaseApplicationEntity> implements IBaseRepository<T> {
  constructor(protected readonly repository: Repository<T>) {}

  async findOne(id: number): Promise<T | null> {
    return this.repository.findOneBy({ id } as unknown as FindOptionsWhere<T>);
  }

  async findOneBy(where: FindOptionsWhere<T>): Promise<T | null> {
    return this.repository.findOneBy(where);
  }

  async find(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  create(data: DeepPartial<T>): T {
    return this.repository.create(data);
  }

  async save(entity: T): Promise<T> {
    return this.repository.save(entity);
  }

  async update(id: number, data: DeepPartial<T>): Promise<T | null> {
    const entity = await this.findOne(id);
    if (!entity) return null;
    
    Object.assign(entity, data);
    return this.save(entity);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }
} 