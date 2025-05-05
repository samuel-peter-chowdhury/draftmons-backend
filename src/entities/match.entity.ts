import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { MatchTeam } from "./match-team.entity";
import { Week } from "./week.entity";
import { Game } from "./game.entity";
import { BaseApplicationEntity } from "./base.entity";

@Entity('match')
export class Match extends BaseApplicationEntity {
  @Column()
  weekId: number;

  @ManyToOne(() => Week, week => week.matches)
  @JoinColumn({ name: 'week_id' })
  week: Week;

  @OneToMany(() => MatchTeam, matchTeam => matchTeam.match)
  matchTeams: MatchTeam[];

  @OneToMany(() => Game, game => game.match)
  games: Game[];
}