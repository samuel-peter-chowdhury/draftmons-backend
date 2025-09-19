import { Repository } from 'typeorm';
import { League } from '../entities/league.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { LeagueInputDto } from '../dtos/league.dto';

@Service()
export class LeagueService extends BaseService<League, LeagueInputDto> {
  constructor(
    @Inject('LeagueRepository')
    private leagueRepository: Repository<League>
  ) {
    super(leagueRepository, 'League');
  }
}
