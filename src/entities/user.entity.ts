import { Entity, Column, OneToMany } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { BaseApplicationEntity } from './base.entity';
import { LeagueUser } from './league-user.entity';
import { Team } from './team.entity';

@Entity('user')
export class User extends BaseApplicationEntity {
  @Column({ nullable: true, name: 'first_name' })
  firstName: string;

  @Column({ nullable: true, name: 'last_name' })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, select: false })
  @Exclude()
  password: string | null;

  @Column({ default: false, name: 'isAdmin' })
  isAdmin: boolean;

  @Column({ nullable: true, name: 'google_id', unique: true })
  googleId: string | null;

  @Column({ nullable: true, name: 'showdown_username' })
  showdownUsername: string | null;

  @Column({ nullable: true, name: 'discord_username' })
  discordUsername: string | null;

  @Column({ nullable: true })
  timezone: string | null;

  @OneToMany(() => LeagueUser, leagueUser => leagueUser.user)
  leagueUsers: LeagueUser[];

  @OneToMany(() => Team, team => team.user)
  teams: Team[];

  @Expose({ groups: ['user.full'] })
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
