import { Entity, Column, ManyToMany } from 'typeorm';
import { BaseApplicationEntity } from './base-application.entity';
import { Move } from './move.entity';

@Entity('special_move_category')
export class SpecialMoveCategory extends BaseApplicationEntity {
  @Column({ unique: true })
  name: string;

  @ManyToMany(() => Move, (move) => move.specialMoveCategories)
  moves: Move[];
}
