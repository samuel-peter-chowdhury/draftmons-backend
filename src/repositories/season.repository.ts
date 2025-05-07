import { Repository } from 'typeorm';
import { Season, SeasonStatus } from '../entities/season.entity';
import { BaseRepository } from './base.repository';

export interface ISeasonRepository extends BaseRepository<Season> {
  findActiveSeason(): Promise<Season | null>;
  findSeasonsByStatus(status: SeasonStatus): Promise<Season[]>;
}

export class SeasonRepository extends BaseRepository<Season> implements ISeasonRepository {
  constructor(repository: Repository<Season>) {
    super(repository);
  }

  async findActiveSeason(): Promise<Season | null> {
    return this.findOneBy({ isActive: true } as any);
  }

  async findSeasonsByStatus(status: SeasonStatus): Promise<Season[]> {
    return this.find({ where: { status: status } });
  }
} 