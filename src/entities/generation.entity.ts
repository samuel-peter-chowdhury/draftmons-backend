import { Entity, Column, OneToMany } from 'typeorm';
import { BaseApplicationEntity } from './base-application.entity';
import { Pokemon } from './pokemon.entity';
import { Season } from './season.entity';
import { Move } from './move.entity';
import { Ability } from './ability.entity';

@Entity('generation')
export class Generation extends BaseApplicationEntity {
  @Column({ unique: true })
  name: string;

  @OneToMany(() => Pokemon, (pokemon) => pokemon.generation)
  pokemon: Pokemon[];

  @OneToMany(() => Move, (move) => move.generation)
  moves: Move[];

  @OneToMany(() => Ability, (ability) => ability.generation)
  abilities: Ability[];

  @OneToMany(() => Season, (season) => season.generation)
  seasons: Season[];
}
