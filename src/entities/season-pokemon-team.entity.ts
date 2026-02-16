import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { SeasonPokemon } from './season-pokemon.entity';
import { Team } from './team.entity';
import { BaseApplicationEntity } from './base-application.entity';

@Entity('season_pokemon_team')
@Unique(['seasonPokemonId', 'teamId'])
export class SeasonPokemonTeam extends BaseApplicationEntity {
  @Column()
  seasonPokemonId: number;

  @Column()
  teamId: number;

  @ManyToOne(() => SeasonPokemon, (seasonPokemon) => seasonPokemon.seasonPokemonTeams)
  @JoinColumn({ name: 'season_pokemon_id' })
  seasonPokemon: SeasonPokemon;

  @ManyToOne(() => Team, (team) => team.seasonPokemonTeams)
  @JoinColumn({ name: 'team_id' })
  team: Team;
}
