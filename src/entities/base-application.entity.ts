import { CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Exclude } from 'class-transformer';

export abstract class BaseApplicationEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  @Exclude({ toPlainOnly: true })
  createdAt: Date;

  @UpdateDateColumn()
  @Exclude({ toPlainOnly: true })
  updatedAt: Date;
}
