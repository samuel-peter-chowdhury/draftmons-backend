import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Pokemon } from "./pokemon.entity";
import { Move } from "./move.entity";

@Entity('pokemon_move')
export class PokemonMove {
  @PrimaryColumn({ name: 'pokemon_id' })
  pokemonId: number;

  @PrimaryColumn({ name: 'move_id' })
  moveId: number;

  @Column()
  gen: string;

  @ManyToOne(() => Pokemon, pokemon => pokemon.moves)
  @JoinColumn({ name: 'pokemon_id' })
  pokemon: Pokemon;

  @ManyToOne(() => Move, move => move.pokemonMoves)
  @JoinColumn({ name: 'move_id' })
  move: Move;
}