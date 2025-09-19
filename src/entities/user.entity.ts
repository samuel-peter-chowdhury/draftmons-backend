import { Entity, Column, OneToMany } from 'typeorm';
import { BaseApplicationEntity } from './base-application.entity';
import { LeagueUser } from './league-user.entity';
import { Team } from './team.entity';

@Entity('user')
export class User extends BaseApplicationEntity {
  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, select: false })
  password: string;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ nullable: true, unique: true })
  googleId: string;

  @Column({ nullable: true })
  showdownUsername: string;

  @Column({ nullable: true })
  discordUsername: string;

  @Column({ nullable: true })
  timezone: string;

  @OneToMany(() => LeagueUser, leagueUser => leagueUser.user)
  leagueUsers: LeagueUser[];

  @OneToMany(() => Team, team => team.user)
  teams: Team[];
}