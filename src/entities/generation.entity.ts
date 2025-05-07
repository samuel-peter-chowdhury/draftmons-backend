import { Entity, Column, OneToMany, ManyToMany } from 'typeorm';
import { BaseApplicationEntity } from './base-application-entity.entity';
import { PokemonMove } from './pokemon-move.entity';
import { Pokemon } from './pokemon.entity';

@Entity('generation')
export class Generation extends BaseApplicationEntity {
  @Column()
  name: string;

  @OneToMany(() => PokemonMove, pokemonMove => pokemonMove.generation)
  pokemonMoves: PokemonMove[];

  @ManyToMany(() => Pokemon, pokemon => pokemon.generations)
  pokemon: Pokemon[];
} 