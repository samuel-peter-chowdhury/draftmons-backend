import { FindOptionsWhere, Repository } from 'typeorm';
import { League } from '../entities/league.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { LeagueInputDto } from '../dtos/league.dto';
import { ConflictError } from '../errors';

@Service()
export class LeagueService extends BaseService<League, LeagueInputDto> {
  constructor(
    @Inject('LeagueRepository')
    private leagueRepository: Repository<League>,
  ) {
    super(leagueRepository, 'League');
  }

  async delete(where: FindOptionsWhere<League>): Promise<boolean> {
    const entity = await this.findOne(where, { seasons: true, leagueUsers: true });
    const children: string[] = [];
    if (entity.seasons?.length) children.push('seasons');
    if (entity.leagueUsers?.length) children.push('league users');
    if (children.length > 0) {
      throw new ConflictError(
        `Cannot delete League: it still has ${children.join(' and ')}. Remove them first.`,
      );
    }
    return super.delete(where);
  }
}
