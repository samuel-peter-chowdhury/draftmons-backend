import { Match } from '../entities/match.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { FindOptionsWhere, Repository } from 'typeorm';
import { MatchInputDto } from '../dtos/match.dto';
import { ConflictError } from '../errors';

@Service()
export class MatchService extends BaseService<Match, MatchInputDto> {
  constructor(
    @Inject('MatchRepository')
    private MatchRepository: Repository<Match>,
  ) {
    super(MatchRepository, 'Match');
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
