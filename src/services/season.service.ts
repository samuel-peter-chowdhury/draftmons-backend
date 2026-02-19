import { Season } from '../entities/season.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { FindOptionsWhere, Repository } from 'typeorm';
import { SeasonInputDto } from '../dtos/season.dto';
import { ConflictError } from '../errors';

@Service()
export class SeasonService extends BaseService<Season, SeasonInputDto> {
  constructor(
    @Inject('SeasonRepository')
    private SeasonRepository: Repository<Season>,
  ) {
    super(SeasonRepository, 'Season');
  }

  async delete(where: FindOptionsWhere<Season>): Promise<boolean> {
    const entity = await this.findOne(where, { teams: true, weeks: true, seasonPokemon: true });
    const children: string[] = [];
    if (entity.teams?.length) children.push('teams');
    if (entity.weeks?.length) children.push('weeks');
    if (entity.seasonPokemon?.length) children.push('season pokemon');
    if (children.length > 0) {
      throw new ConflictError(
        `Cannot delete Season: it still has ${children.join(', ')}. Remove them first.`,
      );
    }
    return super.delete(where);
  }
}
