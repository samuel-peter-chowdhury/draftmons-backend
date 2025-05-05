import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Pokemon } from "./pokemon.entity";
import { PokemonType } from "./pokemon-type.entity";

@Entity('type_effective')
export class TypeEffective {
  @PrimaryColumn()
  pokemonId: number;

  @PrimaryColumn()
  pokemonTypeId: number;

  @ManyToOne(() => PokemonType, pokemonType => pokemonType.typeEffectiveness)
  @JoinColumn({ name: 'pokemon_type_id' })
  pokemonType: PokemonType;

  @Column({ type: 'double precision' })
  value: number;

  @ManyToOne(() => Pokemon, pokemon => pokemon.typeEffectiveness)
  @JoinColumn({ name: 'pokemon_id' })
  pokemon: Pokemon;
}