import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Pokemon } from "./pokemon.entity";
import { Move } from "./move.entity";

@Entity('pokemon_move')
export class PokemonMove {
  @PrimaryColumn()
  pokemonId: number;

  @PrimaryColumn()
  moveId: number;

  @Column()
  gen: string;

  @ManyToOne(() => Pokemon, pokemon => pokemon.pokemonMoves)
  @JoinColumn({ name: 'pokemon_id' })
  pokemon: Pokemon;

  @ManyToOne(() => Move, move => move.pokemonMoves)
  @JoinColumn({ name: 'move_id' })
  move: Move;
}