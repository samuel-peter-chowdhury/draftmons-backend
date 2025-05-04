import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { SeasonPokemon } from "./season-pokemon.entity";
import { Game } from "./game.entity";
import { BaseApplicationEntity } from "./base.entity";

@Entity('game_stat')
export class GameStat extends BaseApplicationEntity {
  @Column({ name: 'game_id' })
  gameId: number;

  @Column({ name: 'season_pokemon_id' })
  seasonPokemonId: number;

  @Column({ name: 'direct_kills', default: 0 })
  directKills: number;

  @Column({ name: 'indirect_kills', default: 0 })
  indirectKills: number;

  @Column({ default: 0 })
  deaths: number;

  @ManyToOne(() => Game, game => game.gameStats)
  @JoinColumn({ name: 'game_id' })
  game: Game;

  @ManyToOne(() => SeasonPokemon, seasonPokemon => seasonPokemon.gameStats)
  @JoinColumn({ name: 'season_pokemon_id' })
  seasonPokemon: SeasonPokemon;
}