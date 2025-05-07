import { Container } from 'typedi';
import AppDataSource from './database.config';
import { User } from '../entities/user.entity';
import { League } from '../entities/league.entity';
import { LeagueUser } from '../entities/league-user.entity';
import { Season } from '../entities/season.entity';
import { Pokemon } from '../entities/pokemon.entity';
import { PokemonMove } from '../entities/pokemon-move.entity';
import { TypeEffective } from '../entities/type-effective.entity';
import { UserRepository } from '../repositories/user.repository';
import { LeagueRepository } from '../repositories/league.repository';
import { PokemonRepository } from '../repositories/pokemon.repository';
import { LeagueUserRepository } from '../repositories/league-user.repository';
import { SeasonRepository } from '../repositories/season.repository';
import { PokemonMoveRepository } from '../repositories/pokemon-move.repository';
import { TypeEffectiveRepository } from '../repositories/type-effective.repository';

export function registerRepositories(): void {
  // Register repositories with TypeORM
  const userRepository = new UserRepository(AppDataSource.getRepository(User));
  const leagueRepository = new LeagueRepository(AppDataSource.getRepository(League));
  const pokemonRepository = new PokemonRepository(AppDataSource.getRepository(Pokemon));
  const leagueUserRepository = new LeagueUserRepository(AppDataSource.getRepository(LeagueUser));
  const seasonRepository = new SeasonRepository(AppDataSource.getRepository(Season));
  const pokemonMoveRepository = new PokemonMoveRepository(AppDataSource.getRepository(PokemonMove));
  const typeEffectiveRepository = new TypeEffectiveRepository(AppDataSource.getRepository(TypeEffective));

  Container.set('UserRepository', userRepository);
  Container.set('LeagueRepository', leagueRepository);
  Container.set('PokemonRepository', pokemonRepository);
  Container.set('LeagueUserRepository', leagueUserRepository);
  Container.set('SeasonRepository', seasonRepository);
  Container.set('PokemonMoveRepository', pokemonMoveRepository);
  Container.set('TypeEffectiveRepository', typeEffectiveRepository);
} 