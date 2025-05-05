import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { League } from "./league.entity";
import { User } from "./user.entity";

@Entity('league_user')
export class LeagueUser {
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