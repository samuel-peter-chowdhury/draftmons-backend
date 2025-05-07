import { Repository } from 'typeorm';
import { TypeEffective } from '../entities/type-effective.entity';
import { BaseRepository } from './base.repository';

export interface ITypeEffectiveRepository extends BaseRepository<TypeEffective> {
}

export class TypeEffectiveRepository extends BaseRepository<TypeEffective> implements ITypeEffectiveRepository {
  constructor(repository: Repository<TypeEffective>) {
    super(repository);
  }
} 