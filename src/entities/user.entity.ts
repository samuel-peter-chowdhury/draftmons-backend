import { Entity, Column, OneToMany } from 'typeorm';
import { BaseApplicationEntity } from './base-application.entity';
import { LeagueUser } from './league-user.entity';
import { Team } from './team.entity';
import { TeamBuild } from './team-build.entity';

@Entity('user')
export class User extends BaseApplicationEntity {
  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ nullable: true, unique: true })
  googleId: string;

  @Column({ nullable: true })
  showdownUsername: string;

  @Column({ nullable: true })
  discordUsername: string;

  @Column({ type: 'varchar', length: 20, nullable: true, unique: true })
  discordId: string | null;

  @Column({ nullable: true })
  timezone: string;

  @OneToMany(() => LeagueUser, (leagueUser) => leagueUser.user)
  leagueUsers: LeagueUser[];

  @OneToMany(() => Team, (team) => team.user)
  teams: Team[];

  @OneToMany(() => TeamBuild, (teamBuild) => teamBuild.user)
  teamBuilds: TeamBuild[];
}
