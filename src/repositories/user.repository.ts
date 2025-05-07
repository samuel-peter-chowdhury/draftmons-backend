import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { BaseRepository } from './base.repository';

export interface IUserRepository extends BaseRepository<User> {
  findByEmail(email: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
}

export class UserRepository extends BaseRepository<User> implements IUserRepository {
  constructor(repository: Repository<User>) {
    super(repository);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOneBy({ email } as any);
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.findOneBy({ googleId } as any);
  }
} 