import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Unique } from 'typeorm';
import { BaseApplicationEntity } from './base-application.entity';
import { Season } from './season.entity';
import { Match } from './match.entity';

@Entity('week')
@Unique(['name', 'seasonId'])
@Unique(['weekNumber', 'seasonId'])
export class Week extends BaseApplicationEntity {
  @Column()
  name: string;

  @Column()
  weekNumber: number;

  @Column()
  seasonId: number;

  @ManyToOne(() => Season, (season) => season.weeks, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'season_id' })
  season: Season;

  @OneToMany(() => Match, (match) => match.week)
  matches: Match[];
}
