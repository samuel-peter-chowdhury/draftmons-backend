import { Column, Entity, ManyToMany, OneToMany } from "typeorm";
import { BaseApplicationEntity } from "./base.entity";
import { Move } from "./move.entity";
import { Pokemon } from "./pokemon.entity";
import { TypeEffective } from "./type-effective.entity";

@Entity('pokemon_type')
export class PokemonType extends BaseApplicationEntity {
  @Column()
  name: string;

  @Column()
  color: string;

  @OneToMany(() => Move, move => move.pokemonType)
  moves: Move[];

  @ManyToMany(() => Pokemon, pokemon => pokemon.pokemonTypes)
  pokemon: Pokemon[];

  @OneToMany(() => TypeEffective, typeEffective => typeEffective.pokemonType)
  typeEffectiveness: TypeEffective[];
}