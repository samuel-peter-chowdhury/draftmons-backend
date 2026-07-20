import { In, FindOptionsRelations, FindOptionsWhere, Repository } from 'typeorm';
import { Match } from '../entities/match.entity';
import { Week } from '../entities/week.entity';
import { Team } from '../entities/team.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { MatchInputDto } from '../dtos/match.dto';
import { ConflictError, ValidationError } from '../errors';
import { DomainEventBus } from '../events/domain-event-bus';

@Service()
export class MatchService extends BaseService<Match, MatchInputDto> {
  constructor(
    @Inject('MatchRepository')
    private MatchRepository: Repository<Match>,
    @Inject('WeekRepository')
    private weekRepository: Repository<Week>,
    @Inject('TeamRepository')
    private teamRepository: Repository<Team>,
    @Inject()
    private eventBus: DomainEventBus,
  ) {
    super(MatchRepository, 'Match');
  }

  async create(data: MatchInputDto): Promise<Match> {
    const { teamIds, ...rest } = data;
    if (!teamIds) {
      return super.create(data);
    }
    await this.validateTeamIds(rest.weekId, teamIds);
    const entity = this.MatchRepository.create({
      ...rest,
      teams: teamIds.map((id) => ({ id })),
    } as unknown as Match);
    return this.MatchRepository.save(entity);
  }

  async update(
    where: FindOptionsWhere<Match>,
    data: Partial<MatchInputDto>,
    relations?: FindOptionsRelations<Match>,
  ): Promise<Match> {
    const { teamIds, ...rest } = data;
    let updated: Match;

    if (teamIds) {
      const existing = await this.findOne(where);
      const weekId = rest.weekId ?? existing.weekId;
      await this.validateTeamIds(weekId, teamIds);
      await this.MatchRepository.save({
        id: existing.id,
        ...rest,
        teams: teamIds.map((id) => ({ id })),
      } as unknown as Match);
      updated = await this.findOne(where, relations);
    } else {
      updated = await super.update(where, rest, relations);
    }

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

  private async validateTeamIds(weekId: number, teamIds: number[]): Promise<void> {
    if (teamIds.length !== 2 || teamIds[0] === teamIds[1]) {
      throw new ValidationError('A match requires exactly two distinct teams.');
    }

    const week = await this.weekRepository.findOne({ where: { id: weekId } });
    if (!week) {
      throw new ValidationError(`Week ${weekId} does not exist.`);
    }

    const teams = await this.teamRepository.find({ where: { id: In(teamIds) } });
    if (teams.length !== 2 || teams.some((team) => team.seasonId !== week.seasonId)) {
      throw new ValidationError(
        "Both teams must belong to the match's season.",
      );
    }
  }

  async delete(where: FindOptionsWhere<Match>): Promise<boolean> {
    const entity = await this.findOne(where, { games: true, teams: true });
    if (entity.games?.length) {
      throw new ConflictError(
        'Cannot delete Match: it still has games. Remove them first.',
      );
    }
    if (entity.teams?.length) {
      // Clear the team_matches join rows first — otherwise the FK on
      // team_matches.match_id blocks the delete below.
      await this.MatchRepository.save({ id: entity.id, teams: [] });
    }
    return super.delete(where);
  }
}
