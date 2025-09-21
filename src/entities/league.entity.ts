import { Entity, Column, OneToMany } from 'typeorm';
import { BaseApplicationEntity } from './base-application.entity';
import { LeagueUser } from './league-user.entity';
import { Season } from './season.entity';

@Entity('league')
export class League extends BaseApplicationEntity {
  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  abbreviation: string;

  @OneToMany(() => LeagueUser, leagueUser => leagueUser.league)
  leagueUsers: LeagueUser[];

  @OneToMany(() => Season, season => season.league)
  seasons: Season[];
}