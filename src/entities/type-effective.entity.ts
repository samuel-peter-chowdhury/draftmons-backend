import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Pokemon } from "./pokemon.entity";

@Entity('type_effective')
export class TypeEffective {
  @PrimaryColumn({ name: 'pokemon_id' })
  pokemonId: number;

  @PrimaryColumn()
  type: string;

  @Column({ type: 'double precision' })
  value: number;

  @ManyToOne(() => Pokemon, pokemon => pokemon.typeEffectiveness)
  @JoinColumn({ name: 'pokemon_id' })
  pokemon: Pokemon;
}