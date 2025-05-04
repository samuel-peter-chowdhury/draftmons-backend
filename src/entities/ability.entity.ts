import { Column, Entity, OneToMany } from "typeorm";
import { PokemonAbility } from "./pokemon-ability.entity";
import { BaseApplicationEntity } from "./base.entity";

@Entity('ability')
export class Ability extends BaseApplicationEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string | null;

  @OneToMany(() => PokemonAbility, pokemonAbility => pokemonAbility.ability)
  pokemonAbilities: PokemonAbility[];
}