import { MatchTeam } from "../entities/match-team.entity";
import { BaseService } from "./base.service";
import { Service, Inject } from 'typedi';
import { Repository } from 'typeorm';
import { MatchTeamInputDto } from "../dtos/match-team.dto";

@Service()
export class MatchTeamService extends BaseService<MatchTeam, MatchTeamInputDto> {
  constructor(
    @Inject('MatchTeamRepository')
    private MatchTeamRepository: Repository<MatchTeam>
  ) {
    super(MatchTeamRepository, 'MatchTeam');
  }
}
