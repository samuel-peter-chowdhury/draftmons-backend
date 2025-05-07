import { Repository } from 'typeorm';
import { League } from '../entities/league.entity';
import { BaseRepository } from './base.repository';

export interface ILeagueRepository extends BaseRepository<League> {
  findByOwnerId(ownerId: number): Promise<League[]>;
  findActiveLeagues(): Promise<League[]>;
  findLeaguesBySeason(seasonId: number): Promise<League[]>;
}

export class LeagueRepository extends BaseRepository<League> implements ILeagueRepository {
  constructor(repository: Repository<League>) {
    super(repository);
  }

  async findByOwnerId(ownerId: number): Promise<League[]> {
    return this.find({ where: { leagueUsers: { userId: ownerId } } });
  }

  async findActiveLeagues(): Promise<League[]> {
    return this.find({ where: { isActive: true } });
  }

  async findLeaguesBySeason(seasonId: number): Promise<League[]> {
    return this.find({ where: { seasons: { id: seasonId } } });
  }
} 