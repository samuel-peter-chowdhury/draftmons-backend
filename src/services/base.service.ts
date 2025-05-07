import { Repository, FindOptionsWhere } from 'typeorm';
import { NotFoundError } from '../errors';
import { BaseApplicationEntity } from '../entities/base-application-entity.entity';

export abstract class BaseService<T extends BaseApplicationEntity> {
  protected repository: Repository<T>;

  constructor(repository: Repository<T>) {
    this.repository = repository;
  }

  async findAll(options?: FindOptionsWhere<T>): Promise<T[]> {
    return this.repository.find({ where: options as any });
  }

  async findOne(id: number): Promise<T> {
    const entity = await this.repository.findOne({ where: { id } as any });

    if (!entity) {
      throw new NotFoundError('Entity', id);
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
