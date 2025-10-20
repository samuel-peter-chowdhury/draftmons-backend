import { GameStat } from '../entities/game-stat.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { Repository } from 'typeorm';
import { GameStatInputDto } from '../dtos/game-stat.dto';

@Service()
export class GameStatService extends BaseService<GameStat, GameStatInputDto> {
  constructor(
    @Inject('GameStatRepository')
    private GameStatRepository: Repository<GameStat>,
  ) {
    super(GameStatRepository, 'GameStat');
  }
}
