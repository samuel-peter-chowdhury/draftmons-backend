import { Repository } from 'typeorm';
import { Pokemon } from '../entities/pokemon.entity';
import { BaseRepository } from './base.repository';

export interface IPokemonRepository extends BaseRepository<Pokemon> {
  findByType(type: string): Promise<Pokemon[]>;
  findByGeneration(generation: number): Promise<Pokemon[]>;
  findByName(name: string): Promise<Pokemon | null>;
  findByDexId(dexId: number): Promise<Pokemon | null>;
}

export class PokemonRepository extends BaseRepository<Pokemon> implements IPokemonRepository {
  constructor(repository: Repository<Pokemon>) {
    super(repository);
  }

  async findByType(type: string): Promise<Pokemon[]> {
    return this.find({ where: { pokemonTypes: { name: type } } });
  }

  async findByGeneration(generation: number): Promise<Pokemon[]> {
    return this.find({ where: { generations: { id: generation } } });
  }

  async findByName(name: string): Promise<Pokemon | null> {
    return this.findOneBy({ name } as any);
  }

  async findByDexId(dexId: number): Promise<Pokemon | null> {
    return this.findOneBy({ dexId } as any);
  }
} 