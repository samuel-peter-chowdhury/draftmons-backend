import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, Unique } from "typeorm";
import { Season } from "./season.entity";
import { SeasonPokemon } from "./season-pokemon.entity";
import { User } from "./user.entity";
import { Game } from "./game.entity";
import { BaseApplicationEntity } from "./base-application.entity";
import { Match } from "./match.entity";

@Entity('team')
@Unique(['name', 'seasonId'])
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

  @OneToMany(() => Game, game => game.losingTeam)
  lostGames: Game[];

  @OneToMany(() => Game, game => game.winningTeam)
  wonGames: Game[];

  @ManyToMany(() => Match, match => match.teams)
  @JoinTable({
    name: 'team_matches',
    joinColumn: {
      name: 'team_id',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'match_id',
      referencedColumnName: 'id'
    }
  })
  matches: Match[];

  @OneToMany(() => Match, match => match.losingTeam)
  lostMatches: Match[];

  @OneToMany(() => Game, match => match.winningTeam)
  wonMatches: Match[];
}