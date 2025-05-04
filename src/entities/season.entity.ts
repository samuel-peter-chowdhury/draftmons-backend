import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { League } from "./league.entity";
import { SeasonPokemon } from "./season-pokemon.entity";
import { Week } from "./week.entity";
import { Team } from "./team.entity";
import { BaseApplicationEntity } from "./base.entity";

@Entity('season')
export class Season extends BaseApplicationEntity {
  @Column()
  name: string;

  @Column()
  gen: string;

  @Column()
  status: string;

  @Column({ nullable: true })
  rules: string | null;

  @Column({ name: 'point_limit', nullable: true })
  pointLimit: number | null;

  @Column({ name: 'max_point_value', nullable: true })
  maxPointValue: number | null;

  @Column({ name: 'league_id' })
  leagueId: number;

  @ManyToOne(() => League, league => league.seasons)
  @JoinColumn({ name: 'league_id' })
  league: League;

  @OneToMany(() => Team, team => team.season)
  teams: Team[];

  @OneToMany(() => Week, week => week.season)
  weeks: Week[];

  @OneToMany(() => SeasonPokemon, seasonPokemon => seasonPokemon.season)
  seasonPokemon: SeasonPokemon[];
}