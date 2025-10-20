import { Container } from 'typedi';
import AppDataSource from './database.config';
import { User } from '../entities/user.entity';
import { League } from '../entities/league.entity';
import { LeagueUser } from '../entities/league-user.entity';
import { Season } from '../entities/season.entity';
import { Pokemon } from '../entities/pokemon.entity';
import { PokemonMove } from '../entities/pokemon-move.entity';
import { TypeEffective } from '../entities/type-effective.entity';
import { Ability } from '../entities/ability.entity';
import { GameStat } from '../entities/game-stat.entity';
import { Game } from '../entities/game.entity';
import { Generation } from '../entities/generation.entity';
import { Match } from '../entities/match.entity';
import { Move } from '../entities/move.entity';
import { PokemonType } from '../entities/pokemon-type.entity';
import { SeasonPokemon } from '../entities/season-pokemon.entity';
import { Team } from '../entities/team.entity';
import { Week } from '../entities/week.entity';

export function registerRepositories(): void {
  Container.set('AbilityRepository', AppDataSource.getRepository(Ability));
  Container.set('GameStatRepository', AppDataSource.getRepository(GameStat));
  Container.set('GameRepository', AppDataSource.getRepository(Game));
  Container.set('GenerationRepository', AppDataSource.getRepository(Generation));
  Container.set('LeagueUserRepository', AppDataSource.getRepository(LeagueUser));
  Container.set('LeagueRepository', AppDataSource.getRepository(League));
  Container.set('MatchRepository', AppDataSource.getRepository(Match));
  Container.set('MoveRepository', AppDataSource.getRepository(Move));
  Container.set('PokemonMoveRepository', AppDataSource.getRepository(PokemonMove));
  Container.set('PokemonTypeRepository', AppDataSource.getRepository(PokemonType));
  Container.set('PokemonRepository', AppDataSource.getRepository(Pokemon));
  Container.set('SeasonPokemonRepository', AppDataSource.getRepository(SeasonPokemon));
  Container.set('SeasonRepository', AppDataSource.getRepository(Season));
  Container.set('TeamRepository', AppDataSource.getRepository(Team));
  Container.set('TypeEffectiveRepository', AppDataSource.getRepository(TypeEffective));
  Container.set('UserRepository', AppDataSource.getRepository(User));
  Container.set('WeekRepository', AppDataSource.getRepository(Week));
}
