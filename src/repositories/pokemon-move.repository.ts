import { Repository } from 'typeorm';
import { PokemonMove } from '../entities/pokemon-move.entity';
import { BaseRepository } from './base.repository';

export interface IPokemonMoveRepository extends BaseRepository<PokemonMove> {
  findByPokemonId(pokemonId: number): Promise<PokemonMove[]>;
  findByMoveType(type: string): Promise<PokemonMove[]>;
  findByMoveName(name: string): Promise<PokemonMove | null>;
  findByMoveCategory(category: string): Promise<PokemonMove[]>;
}

export class PokemonMoveRepository extends BaseRepository<PokemonMove> implements IPokemonMoveRepository {
  constructor(repository: Repository<PokemonMove>) {
    super(repository);
  }

  async findByPokemonId(pokemonId: number): Promise<PokemonMove[]> {
    return this.find({ where: { pokemonId } });
  }

  async findByMoveType(type: string): Promise<PokemonMove[]> {
    return this.find({ where: { move: { pokemonType: { name: type } } } });
  }

  async findByMoveName(name: string): Promise<PokemonMove | null> {
    return this.findOneBy({ name } as any);
  }

  async findByMoveCategory(category: string): Promise<PokemonMove[]> {
    return this.find({ where: { move: { category } } });
  }
} 