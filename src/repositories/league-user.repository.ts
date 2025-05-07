import { Repository } from 'typeorm';
import { LeagueUser } from '../entities/league-user.entity';
import { BaseRepository } from './base.repository';

export interface ILeagueUserRepository extends BaseRepository<LeagueUser> {
  findByLeagueId(leagueId: number): Promise<LeagueUser[]>;
  findByUserId(userId: number): Promise<LeagueUser[]>;
  findByLeagueAndUser(leagueId: number, userId: number): Promise<LeagueUser | null>;
  findActiveLeagueUsers(): Promise<LeagueUser[]>;
}

export class LeagueUserRepository extends BaseRepository<LeagueUser> implements ILeagueUserRepository {
  constructor(repository: Repository<LeagueUser>) {
    super(repository);
  }

  async findByLeagueId(leagueId: number): Promise<LeagueUser[]> {
    return this.find({ where: { leagueId } });
  }

  async findByUserId(userId: number): Promise<LeagueUser[]> {
    return this.find({ where: { userId } });
  }

  async findByLeagueAndUser(leagueId: number, userId: number): Promise<LeagueUser | null> {
    return this.findOneBy({ leagueId, userId } as any);
  }

  async findActiveLeagueUsers(): Promise<LeagueUser[]> {
    return this.find({ where: { isActive: true } });
  }
} 