import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseApplicationEntity } from './base-application.entity';
import { Generation } from './generation.entity';

@Entity('item')
@Unique(['name', 'generationId'])
export class Item extends BaseApplicationEntity {
  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  generationId: number;

  @ManyToOne(() => Generation, (generation) => generation.items, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'generation_id' })
  generation: Generation;
}
