import { Column, Entity, ManyToMany } from "typeorm";
import { Pokemon } from "./pokemon.entity";
import { BaseApplicationEntity } from "./base.entity";

@Entity('ability')
export class Ability extends BaseApplicationEntity {
  @Column()
  name: string;

  @Column()
  description: string;

  @ManyToMany(() => Pokemon, pokemon => pokemon.abilities)
  pokemon: Pokemon[];
}