import { Entity, Column, OneToMany, JoinColumn, ManyToOne } from 'typeorm';
import { BaseApplicationEntity } from './base-application.entity';
import { PokemonMove } from './pokemon-move.entity';
import { PokemonType } from './pokemon-type.entity';

export enum MoveCategory {
  PHYSICAL = "PHYSICAL",
  SPECIAL = "SPECIAL",
  STATUS = "STATUS",
}

@Entity('move')
export class Move extends BaseApplicationEntity {
  @Column({ unique: true })
  name: string;

  @Column()
  pokemonTypeId: number;

  @ManyToOne(() => PokemonType, pokemonType => pokemonType.moves)
  @JoinColumn({ name: 'pokemon_type_id' })
  pokemonType: PokemonType;

  @Column({
    type: "enum",
    enum: MoveCategory,
  })
  category: MoveCategory;

  @Column()
  power: number;

  @Column()
  accuracy: number;

  @Column()
  priority: number;

  @Column()
  pp: number;

  @Column()
  description: string;

  @OneToMany(() => PokemonMove, pokemonMove => pokemonMove.move)
  pokemonMoves: PokemonMove[];
}