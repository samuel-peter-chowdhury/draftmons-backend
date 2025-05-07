import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseApplicationEntity } from './base-application-entity.entity';
import { Season } from './season.entity';
import { Match } from './match.entity';

@Entity('week')
export class Week extends BaseApplicationEntity {
  @Column()
  name: string;

  @Column()
  seasonId: number;

  @ManyToOne(() => Season, season => season.weeks)
  @JoinColumn({ name: 'season_id' })
  season: Season;

  @OneToMany(() => Match, match => match.week)
  matches: Match[];
}