import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { SeasonPokemon } from './season-pokemon.entity';
import { Game } from './game.entity';
import { BaseApplicationEntity } from './base-application.entity';

@Entity('game_stat')
@Unique(['gameId', 'seasonPokemonId'])
export class GameStat extends BaseApplicationEntity {
  @Column()
  gameId: number;

  @Column()
  seasonPokemonId: number;

  @Column()
  directKills: number;

  @Column()
  indirectKills: number;

  @Column()
  deaths: number;

  @ManyToOne(() => Game, (game) => game.gameStats)
  @JoinColumn({ name: 'game_id' })
  game: Game;

  @ManyToOne(() => SeasonPokemon, (seasonPokemon) => seasonPokemon.gameStats)
  @JoinColumn({ name: 'season_pokemon_id' })
  seasonPokemon: SeasonPokemon;
}
