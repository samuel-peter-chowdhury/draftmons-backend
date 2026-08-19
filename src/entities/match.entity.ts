import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany } from 'typeorm';
import { Week } from './week.entity';
import { Game } from './game.entity';
import { BaseApplicationEntity } from './base-application.entity';
import { Team } from './team.entity';

/**
 * How a match's result got into the system. NULL means "no result yet".
 * REPLAY  — parsed from Showdown replays via the match-upload analyze/submit flow.
 * MANUAL  — entered by a moderator, optionally with per-game replay links/stats.
 * FORFEIT — decided without play; games (if any) are placeholders with differential 0.
 */
export enum MatchResultSource {
  REPLAY = 'REPLAY',
  MANUAL = 'MANUAL',
  FORFEIT = 'FORFEIT',
}

@Entity('match')
export class Match extends BaseApplicationEntity {
  @Column()
  weekId: number;

  @Column({ nullable: true })
  losingTeamId: number;

  @Column({ nullable: true })
  winningTeamId: number;

  @Column({
    type: 'enum',
    enum: MatchResultSource,
    nullable: true,
  })
  resultSource: MatchResultSource | null;

  @ManyToOne(() => Week, (week) => week.matches, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'week_id' })
  week: Week;

  @ManyToMany(() => Team, (team) => team.matches)
  teams: Team[];

  @ManyToOne(() => Team, (team) => team.lostMatches, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'losing_team_id' })
  losingTeam: Team;

  @ManyToOne(() => Team, (team) => team.wonMatches, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'winning_team_id' })
  winningTeam: Team;

  @OneToMany(() => Game, (game) => game.match)
  games: Game[];
}
