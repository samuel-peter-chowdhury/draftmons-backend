import { SeasonPokemonTeam } from '../entities/season-pokemon-team.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { Repository } from 'typeorm';
import { SeasonPokemonTeamInputDto } from '../dtos/season-pokemon-team.dto';
import { DomainEventBus } from '../events/domain-event-bus';

@Service()
export class SeasonPokemonTeamService extends BaseService<SeasonPokemonTeam, SeasonPokemonTeamInputDto> {
  constructor(
    @Inject('SeasonPokemonTeamRepository')
    private seasonPokemonTeamRepository: Repository<SeasonPokemonTeam>,
    @Inject()
    private eventBus: DomainEventBus,
  ) {
    super(seasonPokemonTeamRepository, 'SeasonPokemonTeam');
  }

  async create(data: SeasonPokemonTeamInputDto): Promise<SeasonPokemonTeam> {
    const created = await super.create(data);
    const full = await this.findOne(
      { id: created.id },
      { seasonPokemon: { pokemon: true, season: { league: true } }, team: { user: true } },
    );
    this.eventBus.emitDraftPick({ seasonPokemonTeam: full });
    return created;
  }
}
