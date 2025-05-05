import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { Match } from "./match.entity";
import { Team } from "./team.entity";
import { GameStat } from "./game-stat.entity";
import { BaseApplicationEntity } from "./base.entity";

@Entity('game')
export class Game extends BaseApplicationEntity {
  @Column()
  matchId: number;

  @Column()
  winningTeamId: number;

  @Column()
  differential: number;

  @Column({ nullable: true })
  replayLink: string;

  @ManyToOne(() => Match, match => match.games)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @ManyToOne(() => Team, team => team.wonGames)
  @JoinColumn({ name: 'winning_team_id' })
  winningTeam: Team;

  @OneToMany(() => GameStat, gameStat => gameStat.game)
  gameStats: GameStat[];
}