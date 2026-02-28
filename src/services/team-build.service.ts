import { TeamBuild } from '../entities/team-build.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { FindOptionsRelations, FindOptionsWhere, Repository } from 'typeorm';
import { TeamBuildInputDto } from '../dtos/team-build.dto';
import { ValidationError } from '../errors';
import { Season } from '../entities/season.entity';

@Service()
export class TeamBuildService extends BaseService<TeamBuild, TeamBuildInputDto> {
  constructor(
    @Inject('TeamBuildRepository')
    private teamBuildRepository: Repository<TeamBuild>,
    @Inject('SeasonRepository')
    private seasonRepository: Repository<Season>,
  ) {
    super(teamBuildRepository, 'TeamBuild');
  }

  private async validateSeasonGeneration(
    seasonId: number | undefined | null,
    generationId: number,
  ): Promise<void> {
    if (seasonId != null) {
      const season = await this.seasonRepository.findOne({
        where: { id: seasonId },
      });
      if (!season) {
        throw new ValidationError(`Season with id ${seasonId} not found`);
      }
      if (season.generationId !== generationId) {
        throw new ValidationError(
          `Season generation (${season.generationId}) does not match team build generation (${generationId})`,
        );
      }
    }
  }

  async create(data: TeamBuildInputDto): Promise<TeamBuild> {
    await this.validateSeasonGeneration(data.seasonId, data.generationId);
    return super.create(data);
  }

  async update(
    where: FindOptionsWhere<TeamBuild>,
    data: Partial<TeamBuildInputDto>,
    relations?: FindOptionsRelations<TeamBuild>,
  ): Promise<TeamBuild> {
    const existing = await this.findOne(where);
    const finalGenerationId = data.generationId ?? existing.generationId;
    const finalSeasonId = data.seasonId !== undefined ? data.seasonId : existing.seasonId;
    await this.validateSeasonGeneration(finalSeasonId, finalGenerationId);
    await this.repository.update(where, data as any);
    return this.findOne(where, relations);
  }
}
