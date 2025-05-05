import { Entity, Column, OneToMany } from 'typeorm';
import { BaseApplicationEntity } from './base.entity';
import { LeagueUser } from './league-user.entity';
import { Season } from './season.entity';

@Entity('league')
export class League extends BaseApplicationEntity {
  @Column()
  name: string;

  @Column()
  abbreviation: string;

  @Column({ nullable: true, select: false })
  password: string;

  @OneToMany(() => LeagueUser, leagueUser => leagueUser.league)
  leagueUsers: LeagueUser[];

  @OneToMany(() => Season, season => season.league)
  seasons: Season[];
}