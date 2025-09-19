import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { Season } from "./season.entity";
import { SeasonPokemon } from "./season-pokemon.entity";
import { User } from "./user.entity";
import { Game } from "./game.entity";
import { MatchTeam } from "./match-team.entity";
import { BaseApplicationEntity } from "./base-application.entity";

@Entity('team')
export class Team extends BaseApplicationEntity {
  @Column()
  name: string;

  @Column()
  seasonId: number;

  @Column()
  userId: number;

  @ManyToOne(() => Season, season => season.teams)
  @JoinColumn({ name: 'season_id' })
  season: Season;

  @ManyToOne(() => User, user => user.teams)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => SeasonPokemon, seasonPokemon => seasonPokemon.team)
  seasonPokemon: SeasonPokemon[];

  @OneToMany(() => MatchTeam, matchTeam => matchTeam.team)
  matchTeams: MatchTeam[];

  @OneToMany(() => Game, game => game.winningTeam)
  wonGames: Game[];
}