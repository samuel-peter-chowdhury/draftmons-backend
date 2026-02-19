import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany } from 'typeorm';
import { Week } from './week.entity';
import { Game } from './game.entity';
import { BaseApplicationEntity } from './base-application.entity';
import { Team } from './team.entity';

@Entity('match')
export class Match extends BaseApplicationEntity {
  @Column()
  weekId: number;

  @Column({ nullable: true })
  losingTeamId: number;

  @Column({ nullable: true })
  winningTeamId: number;

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
