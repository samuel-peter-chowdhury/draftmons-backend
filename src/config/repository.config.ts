import { Container } from 'typedi';
import AppDataSource from './database.config';
import { User } from '../entities/user.entity';
import { League } from '../entities/league.entity';
import { LeagueUser } from '../entities/league-user.entity';
import { Season } from '../entities/season.entity';
import { Pokemon } from '../entities/pokemon.entity';
import { PokemonMove } from '../entities/pokemon-move.entity';
import { TypeEffective } from '../entities/type-effective.entity';

export function registerRepositories(): void {
  Container.set('UserRepository', AppDataSource.getRepository(User));
  Container.set('LeagueRepository', AppDataSource.getRepository(League));
  Container.set('PokemonRepository', AppDataSource.getRepository(Pokemon));
  Container.set('LeagueUserRepository', AppDataSource.getRepository(LeagueUser));
  Container.set('SeasonRepository', AppDataSource.getRepository(Season));
  Container.set('PokemonMoveRepository', AppDataSource.getRepository(PokemonMove));
  Container.set('TypeEffectiveRepository', AppDataSource.getRepository(TypeEffective));
} 