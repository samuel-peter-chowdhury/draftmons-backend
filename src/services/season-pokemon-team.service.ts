import { SeasonPokemonTeam } from '../entities/season-pokemon-team.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { Repository } from 'typeorm';
import { SeasonPokemonTeamInputDto } from '../dtos/season-pokemon-team.dto';

@Service()
export class SeasonPokemonTeamService extends BaseService<SeasonPokemonTeam, SeasonPokemonTeamInputDto> {
  constructor(
    @Inject('SeasonPokemonTeamRepository')
    private seasonPokemonTeamRepository: Repository<SeasonPokemonTeam>,
  ) {
    super(seasonPokemonTeamRepository, 'SeasonPokemonTeam');
  }
}
