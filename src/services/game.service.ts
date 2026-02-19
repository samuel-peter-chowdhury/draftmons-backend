import { Game } from '../entities/game.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { FindOptionsWhere, Repository } from 'typeorm';
import { GameInputDto } from '../dtos/game.dto';
import { ConflictError } from '../errors';

@Service()
export class GameService extends BaseService<Game, GameInputDto> {
  constructor(
    @Inject('GameRepository')
    private GameRepository: Repository<Game>,
  ) {
    super(GameRepository, 'Game');
  }

  async delete(where: FindOptionsWhere<Game>): Promise<boolean> {
    const entity = await this.findOne(where, { gameStats: true });
    if (entity.gameStats?.length) {
      throw new ConflictError(
        'Cannot delete Game: it still has game stats. Remove them first.',
      );
    }
    return super.delete(where);
  }
}
