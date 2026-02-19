import { Team } from '../entities/team.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { FindOptionsWhere, Repository } from 'typeorm';
import { TeamInputDto } from '../dtos/team.dto';
import { ConflictError } from '../errors';

@Service()
export class TeamService extends BaseService<Team, TeamInputDto> {
  constructor(
    @Inject('TeamRepository')
    private TeamRepository: Repository<Team>,
  ) {
    super(TeamRepository, 'Team');
  }

  async delete(where: FindOptionsWhere<Team>): Promise<boolean> {
    const entity = await this.findOne(where, {
      seasonPokemonTeams: true,
      wonGames: true,
      lostGames: true,
    });
    const children: string[] = [];
    if (entity.seasonPokemonTeams?.length) children.push('drafted pokemon');
    if (entity.wonGames?.length || entity.lostGames?.length) children.push('games');
    if (children.length > 0) {
      throw new ConflictError(
        `Cannot delete Team: it still has ${children.join(' and ')}. Remove them first.`,
      );
    }
    return super.delete(where);
  }
}
