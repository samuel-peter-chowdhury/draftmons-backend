import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { League } from './league.entity';
import { User } from './user.entity';
import { BaseApplicationEntity } from './base-application.entity';

@Entity('league_user')
@Unique(['leagueId', 'userId'])
export class LeagueUser extends BaseApplicationEntity {
  @Column()
  leagueId: number;

  @Column()
  userId: number;

  @Column({ default: false })
  isModerator: boolean;

  @ManyToOne(() => League, (league) => league.leagueUsers, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'league_id' })
  league: League;

  @ManyToOne(() => User, (user) => user.leagueUsers, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
