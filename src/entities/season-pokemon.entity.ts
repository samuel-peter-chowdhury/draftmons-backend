import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { Season } from "./season.entity";
import { Pokemon } from "./pokemon.entity";
import { Team } from "./team.entity";
import { GameStat } from "./game-stat.entity";
import { BaseApplicationEntity } from "./base.entity";

@Entity('season_pokemon')
export class SeasonPokemon extends BaseApplicationEntity {
  @Column({ name: 'season_id' })
  seasonId: number;

  @Column({ name: 'pokemon_id' })
  pokemonId: number;

  @Column({ name: 'team_id', nullable: true })
  teamId: number | null;

  @Column({ nullable: true })
  condition: string | null;

  @Column({ name: 'point_value', nullable: true })
  pointValue: number | null;

  @ManyToOne(() => Season, season => season.seasonPokemon)
  @JoinColumn({ name: 'season_id' })
  season: Season;

  @ManyToOne(() => Pokemon, pokemon => pokemon.seasonPokemon)
  @JoinColumn({ name: 'pokemon_id' })
  pokemon: Pokemon;

  @ManyToOne(() => Team, team => team.seasonPokemon, { nullable: true })
  @JoinColumn({ name: 'team_id' })
  team: Team | null;

  @OneToMany(() => GameStat, gameStat => gameStat.seasonPokemon)
  gameStats: GameStat[];
}