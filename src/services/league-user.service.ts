import { LeagueUser } from "../entities/league-user.entity";
import { BaseService } from "./base.service";
import { Service, Inject } from 'typedi';
import { Repository } from 'typeorm';
import { LeagueUserInputDto } from "../dtos/league-user.dto";

@Service()
export class LeagueUserService extends BaseService<LeagueUser, LeagueUserInputDto> {
  constructor(
    @Inject('LeagueUserRepository')
    private LeagueUserRepository: Repository<LeagueUser>
  ) {
    super(LeagueUserRepository, 'LeagueUser');
  }
}
