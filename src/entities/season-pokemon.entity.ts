import { Column, Entity, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import { Season } from './season.entity';
import { Pokemon } from './pokemon.entity';
import { Team } from './team.entity';
import { GameStat } from './game-stat.entity';
import { BaseApplicationEntity } from './base-application.entity';

@Entity('season_pokemon')
@Unique(['seasonId', 'pokemonId'])
export class SeasonPokemon extends BaseApplicationEntity {
  @Column()
  seasonId: number;

  @Column()
  pokemonId: number;

  @Column({ nullable: true })
  teamId: number;

  @Column({ nullable: true })
  condition: string;

  @Column({ nullable: true })
  pointValue: number;

  @ManyToOne(() => Season, (season) => season.seasonPokemon)
  @JoinColumn({ name: 'season_id' })
  season: Season;

  @ManyToOne(() => Pokemon, (pokemon) => pokemon.seasonPokemon)
  @JoinColumn({ name: 'pokemon_id' })
  pokemon: Pokemon;

  @ManyToOne(() => Team, (team) => team.seasonPokemon, { nullable: true })
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @OneToMany(() => GameStat, (gameStat) => gameStat.seasonPokemon)
  gameStats: GameStat[];
}
