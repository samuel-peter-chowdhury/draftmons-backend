import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Pokemon } from "./pokemon.entity";
import { Move } from "./move.entity";
import { BaseApplicationEntity } from "./base-application.entity";
import { Generation } from "./generation.entity";

@Entity('pokemon_move')
export class PokemonMove extends BaseApplicationEntity {
  @Column()
  pokemonId: number;

  @Column()
  moveId: number;

  @Column()
  generationId: number;

  @ManyToOne(() => Pokemon, pokemon => pokemon.pokemonMoves)
  @JoinColumn({ name: 'pokemon_id' })
  pokemon: Pokemon;

  @ManyToOne(() => Move, move => move.pokemonMoves)
  @JoinColumn({ name: 'move_id' })
  move: Move;

  @ManyToOne(() => Generation, generation => generation.pokemonMoves)
  @JoinColumn({ name: 'generation_id' })
  generation: Generation;
}