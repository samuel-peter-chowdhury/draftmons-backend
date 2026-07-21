import { Team } from '../entities/team.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { FindOptionsRelations, FindOptionsWhere, Repository } from 'typeorm';
import { TeamInputDto } from '../dtos/team.dto';
import { ConflictError } from '../errors';
import { deleteOwnedBlob } from '../utils/blob.utils';

@Service()
export class TeamService extends BaseService<Team, TeamInputDto> {
  constructor(
    @Inject('TeamRepository')
    private TeamRepository: Repository<Team>,
  ) {
    super(TeamRepository, 'Team');
  }

  async update(
    where: FindOptionsWhere<Team>,
    data: Partial<TeamInputDto>,
    relations?: FindOptionsRelations<Team>,
  ): Promise<Team> {
    const oldLogoUrl = data.logoUrl !== undefined ? (await this.findOne(where)).logoUrl : undefined;
    const updated = await super.update(where, data, relations);
    if (oldLogoUrl && oldLogoUrl !== updated.logoUrl) {
      await deleteOwnedBlob(oldLogoUrl);
    }
    return updated;
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
