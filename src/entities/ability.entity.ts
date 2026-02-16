import { Column, Entity, ManyToMany, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Pokemon } from './pokemon.entity';
import { BaseApplicationEntity } from './base-application.entity';
import { Generation } from './generation.entity';

@Entity('ability')
@Unique(['name', 'generationId'])
export class Ability extends BaseApplicationEntity {
  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  generationId: number;

  @ManyToOne(() => Generation, (generation) => generation.abilities)
  @JoinColumn({ name: 'generation_id' })
  generation: Generation;

  @ManyToMany(() => Pokemon, (pokemon) => pokemon.abilities)
  pokemon: Pokemon[];
}
