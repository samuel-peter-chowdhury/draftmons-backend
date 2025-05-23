import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Pokemon } from "./pokemon.entity";
import { PokemonType } from "./pokemon-type.entity";
import { BaseApplicationEntity } from "./base-application-entity.entity";

@Entity('type_effective')
export class TypeEffective extends BaseApplicationEntity {
  @Column()
  pokemonId: number;

  @Column()
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