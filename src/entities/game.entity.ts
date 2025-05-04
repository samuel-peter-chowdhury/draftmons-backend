import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { Match } from "./match.entity";
import { Team } from "./team.entity";
import { GameStat } from "./game-stat.entity";
import { BaseApplicationEntity } from "./base.entity";

@Entity('game')
export class Game extends BaseApplicationEntity {
  @Column({ name: 'match_id' })
  matchId: number;

  @Column({ name: 'winning_team_id', nullable: true })
  winningTeamId: number | null;

  @Column({ nullable: true })
  differential: number | null;

  @Column({ name: 'replay_link', nullable: true })
  replayLink: string | null;

  @ManyToOne(() => Match, match => match.games)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @ManyToOne(() => Team, team => team.wonGames, { nullable: true })
  @JoinColumn({ name: 'winning_team_id' })
  winningTeam: Team | null;

  @OneToMany(() => GameStat, gameStat => gameStat.game)
  gameStats: GameStat[];
}