import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Pokemon } from "./pokemon.entity";

@Entity('pokemon_type')
export class PokemonType {
  @PrimaryColumn({ name: 'pokemon_id' })
  pokemonId: number;

  @PrimaryColumn()
  type: string;

  @ManyToOne(() => Pokemon, pokemon => pokemon.types)
  @JoinColumn({ name: 'pokemon_id' })
  pokemon: Pokemon;
}