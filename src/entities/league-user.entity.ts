import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { League } from "./league.entity";
import { User } from "./user.entity";

@Entity('league_user')
export class LeagueUser {
  @Column({ primary: true, name: 'league_id' })
  leagueId: number;

  @Column({ primary: true, name: 'user_id' })
  userId: number;

  @Column({ default: false, name: 'isModerator' })
  isModerator: boolean;

  @ManyToOne(() => League, league => league.leagueUsers)
  @JoinColumn({ name: 'league_id' })
  league: League;

  @ManyToOne(() => User, user => user.leagueUsers)
  @JoinColumn({ name: 'user_id' })
  user: User;
}