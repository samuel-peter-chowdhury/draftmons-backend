import { Repository } from 'typeorm';
import { Pokemon } from '../entities/pokemon.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';

@Service()
export class PokemonService extends BaseService<Pokemon> {

  private readonly basic_relations = {
    pokemonTypes: true,
    abilities: true,
  };

  private readonly detailed_relations = {
    ...this.basic_relations,
    pokemonMoves: {
      move: true,
    },
  };

  constructor(
    @Inject('PokemonRepository')
    private pokemonRepository: Repository<Pokemon>,
  ) {
    super(pokemonRepository, 'Pokemon');
  }

  async findOneBasic(id: number, where?: any): Promise<Pokemon> {
    return this.findOne(id, where, this.basic_relations);
  }

  async findOneFull(id: number, where?: any): Promise<Pokemon> {
    return this.findOne(id, where, this.detailed_relations);
  }

  async findAllBasic(where?: any): Promise<Pokemon[]> {
    return this.findAll(where, this.basic_relations);
  }

  async findAllFull(where?: any): Promise<Pokemon[]> {
    return this.findAll(where, this.detailed_relations);
  }
}
