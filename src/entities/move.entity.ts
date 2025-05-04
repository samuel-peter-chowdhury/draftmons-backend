import { Entity, Column, OneToMany } from 'typeorm';
import { BaseApplicationEntity } from './base.entity';
import { PokemonMove } from './pokemon-move.entity';

@Entity('move')
export class Move extends BaseApplicationEntity {
  @Column()
  name: string;

  @Column()
  type: string;

  @Column()
  category: string;

  @Column({ nullable: true })
  power: number;

  @Column({ nullable: true })
  accuracy: number | null;

  @Column({ default: 0 })
  priority: number;

  @Column({ nullable: true })
  pp: number | null;

  @Column({ nullable: true })
  description: string | null;

  @OneToMany(() => PokemonMove, pokemonMove => pokemonMove.move)
  pokemonMoves: PokemonMove[];
}
