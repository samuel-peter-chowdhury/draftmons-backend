import { SeasonPokemon } from '../entities/season-pokemon.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { Repository } from 'typeorm';
import { SeasonPokemonInputDto } from '../dtos/season-pokemon.dto';

@Service()
export class SeasonPokemonService extends BaseService<SeasonPokemon, SeasonPokemonInputDto> {
  constructor(
    @Inject('SeasonPokemonRepository')
    private SeasonPokemonRepository: Repository<SeasonPokemon>,
  ) {
    super(SeasonPokemonRepository, 'SeasonPokemon');
  }
}
