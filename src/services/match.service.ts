import { Match } from '../entities/match.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { FindOptionsRelations, FindOptionsWhere, Repository } from 'typeorm';
import { MatchInputDto } from '../dtos/match.dto';
import { ConflictError } from '../errors';
import { DomainEventBus } from '../events/domain-event-bus';

@Service()
export class MatchService extends BaseService<Match, MatchInputDto> {
  constructor(
    @Inject('MatchRepository')
    private MatchRepository: Repository<Match>,
    @Inject()
    private eventBus: DomainEventBus,
  ) {
    super(MatchRepository, 'Match');
  }

  async update(
    where: FindOptionsWhere<Match>,
    data: Partial<MatchInputDto>,
    relations?: FindOptionsRelations<Match>,
  ): Promise<Match> {
    const updated = await super.update(where, data, relations);
    const hasResult = data.winningTeamId !== undefined || data.losingTeamId !== undefined;
    if (hasResult && (updated.winningTeamId || updated.losingTeamId)) {
      const full = await this.findOne(where, {
        week: { season: { league: true } },
        winningTeam: { user: true },
        losingTeam: { user: true },
        games: true,
      });
      this.eventBus.emitMatchCompleted({ match: full });
    }
    return updated;
  }

  async delete(where: FindOptionsWhere<Match>): Promise<boolean> {
    const entity = await this.findOne(where, { games: true });
    if (entity.games?.length) {
      throw new ConflictError(
        'Cannot delete Match: it still has games. Remove them first.',
      );
    }
    return super.delete(where);
  }
}
