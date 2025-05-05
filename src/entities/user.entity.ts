import { Entity, Column, OneToMany } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { BaseApplicationEntity } from './base.entity';
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
  @Exclude()
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

  @Expose({ groups: ['user.full'] })
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}