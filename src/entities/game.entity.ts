import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Match } from './match.entity';
import { Team } from './team.entity';
import { GameStat } from './game-stat.entity';
import { BaseApplicationEntity } from './base-application.entity';

@Entity('game')
export class Game extends BaseApplicationEntity {
  @Column()
  matchId: number;

  @Column()
  losingTeamId: number;

  @Column()
  winningTeamId: number;

  @Column()
  differential: number;

  @Column({ nullable: true, unique: true })
  replayLink: string;

  @ManyToOne(() => Match, (match) => match.games, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @ManyToOne(() => Team, (team) => team.lostGames, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'losing_team_id' })
  losingTeam: Team;

  @ManyToOne(() => Team, (team) => team.wonGames, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'winning_team_id' })
  winningTeam: Team;

  @OneToMany(() => GameStat, (gameStat) => gameStat.game)
  gameStats: GameStat[];
}
