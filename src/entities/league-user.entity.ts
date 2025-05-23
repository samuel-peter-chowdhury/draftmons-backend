import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { League } from "./league.entity";
import { User } from "./user.entity";
import { BaseApplicationEntity } from "./base-application-entity.entity";

@Entity('league_user')
export class LeagueUser extends BaseApplicationEntity {
  @Column({ primary: true })
  leagueId: number;

  @Column({ primary: true })
  userId: number;

  @Column({ default: false })
  isModerator: boolean;

  @ManyToOne(() => League, league => league.leagueUsers)
  @JoinColumn({ name: 'league_id' })
  league: League;

  @ManyToOne(() => User, user => user.leagueUsers)
  @JoinColumn({ name: 'user_id' })
  user: User;
}