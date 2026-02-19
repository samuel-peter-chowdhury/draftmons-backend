import { Entity, Column, ManyToOne, ManyToMany, JoinColumn, JoinTable, Unique } from 'typeorm';
import { BaseApplicationEntity } from './base-application.entity';
import { Pokemon } from './pokemon.entity';
import { PokemonType } from './pokemon-type.entity';
import { SpecialMoveCategory } from './special-move-category.entity';
import { Generation } from './generation.entity';

export enum MoveCategory {
  PHYSICAL = 'PHYSICAL',
  SPECIAL = 'SPECIAL',
  STATUS = 'STATUS',
}

@Entity('move')
@Unique(['name', 'generationId'])
export class Move extends BaseApplicationEntity {
  @Column()
  name: string;

  @Column()
  pokemonTypeId: number;

  @Column()
  generationId: number;

  @ManyToOne(() => PokemonType, (pokemonType) => pokemonType.moves, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'pokemon_type_id' })
  pokemonType: PokemonType;

  @ManyToOne(() => Generation, (generation) => generation.moves, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'generation_id' })
  generation: Generation;

  @Column({
    type: 'enum',
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

  @ManyToMany(() => Pokemon, (pokemon) => pokemon.moves)
  pokemon: Pokemon[];

  @ManyToMany(() => SpecialMoveCategory, (specialMoveCategory) => specialMoveCategory.moves)
  @JoinTable({
    name: 'move_special_move_categories',
    joinColumn: {
      name: 'move_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'special_move_category_id',
      referencedColumnName: 'id',
    },
  })
  specialMoveCategories: SpecialMoveCategory[];
}
