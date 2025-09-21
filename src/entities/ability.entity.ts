import { Column, Entity, ManyToMany } from "typeorm";
import { Pokemon } from "./pokemon.entity";
import { BaseApplicationEntity } from "./base-application.entity";

@Entity('ability')
export class Ability extends BaseApplicationEntity {
  @Column({ unique: true })
  name: string;

  @Column()
  description: string;

  @ManyToMany(() => Pokemon, pokemon => pokemon.abilities)
  pokemon: Pokemon[];
}