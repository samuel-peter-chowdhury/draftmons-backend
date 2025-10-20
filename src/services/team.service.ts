import { Team } from '../entities/team.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { Repository } from 'typeorm';
import { TeamInputDto } from '../dtos/team.dto';

@Service()
export class TeamService extends BaseService<Team, TeamInputDto> {
  constructor(
    @Inject('TeamRepository')
    private TeamRepository: Repository<Team>,
  ) {
    super(TeamRepository, 'Team');
  }
}
