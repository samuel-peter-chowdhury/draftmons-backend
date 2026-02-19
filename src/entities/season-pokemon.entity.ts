import { Column, Entity, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import { Season } from './season.entity';
import { Pokemon } from './pokemon.entity';
import { GameStat } from './game-stat.entity';
import { BaseApplicationEntity } from './base-application.entity';
import { SeasonPokemonTeam } from './season-pokemon-team.entity';

@Entity('season_pokemon')
@Unique(['seasonId', 'pokemonId'])
export class SeasonPokemon extends BaseApplicationEntity {
  @Column()
  seasonId: number;

  @Column()
  pokemonId: number;

  @Column({ nullable: true })
  condition: string;

  @Column({ nullable: true })
  pointValue: number;

  @ManyToOne(() => Season, (season) => season.seasonPokemon, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'season_id' })
  season: Season;

  @ManyToOne(() => Pokemon, (pokemon) => pokemon.seasonPokemon, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'pokemon_id' })
  pokemon: Pokemon;

  @OneToMany(() => SeasonPokemonTeam, (seasonPokemonTeam) => seasonPokemonTeam.seasonPokemon)
  seasonPokemonTeams: SeasonPokemonTeam[];

  @OneToMany(() => GameStat, (gameStat) => gameStat.seasonPokemon)
  gameStats: GameStat[];
}
