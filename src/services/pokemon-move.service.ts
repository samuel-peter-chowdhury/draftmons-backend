import { PokemonMove } from '../entities/pokemon-move.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { Repository } from 'typeorm';
import { PokemonMoveInputDto } from '../dtos/pokemon-move.dto';

@Service()
export class PokemonMoveService extends BaseService<PokemonMove, PokemonMoveInputDto> {
  constructor(
    @Inject('PokemonMoveRepository')
    private PokemonMoveRepository: Repository<PokemonMove>,
  ) {
    super(PokemonMoveRepository, 'PokemonMove');
  }
}
