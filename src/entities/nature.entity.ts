import { Entity, Column } from 'typeorm';
import { BaseApplicationEntity } from './base-application.entity';

export enum StatType {
  HP = 'HP',
  ATTACK = 'ATTACK',
  DEFENSE = 'DEFENSE',
  SPECIAL_ATTACK = 'SPECIAL_ATTACK',
  SPECIAL_DEFENSE = 'SPECIAL_DEFENSE',
  SPEED = 'SPEED',
}

@Entity('nature')
export class Nature extends BaseApplicationEntity {
  @Column({ unique: true })
  name: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: StatType,
    nullable: true,
  })
  positiveStat: StatType | null;

  @Column({
    type: 'enum',
    enum: StatType,
    nullable: true,
  })
  negativeStat: StatType | null;
}
