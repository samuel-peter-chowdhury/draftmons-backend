import { Game } from '../entities/game.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { Repository } from 'typeorm';
import { GameInputDto } from '../dtos/game.dto';

@Service()
export class GameService extends BaseService<Game, GameInputDto> {
  constructor(
    @Inject('GameRepository')
    private GameRepository: Repository<Game>,
  ) {
    super(GameRepository, 'Game');
  }
}
