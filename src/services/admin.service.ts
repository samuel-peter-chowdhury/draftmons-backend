import { Service } from 'typedi';
import AppDataSource from '../config/database.config';

@Service()
export class AdminService {
  /**
   * Wipes all data from the database by truncating all entity tables.
   * Uses TRUNCATE with RESTART IDENTITY CASCADE to handle foreign key
   * constraints and reset auto-increment sequences.
   */
  async wipeAllData(): Promise<void> {
    const entities = AppDataSource.entityMetadatas;
    const tableNames = entities.map(entity => `"${entity.tableName}"`).join(', ');
    await AppDataSource.query(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`);
  }

  /**
   * Initializes all Pokemon-related data (types, generations, abilities, moves, pokemon, etc.)
   * using a third-party data source.
   */
  async initializePokemonData(): Promise<void> {
    // TODO: Implement Pokemon data initialization
  }

  /**
   * Creates mock data for non-Pokemon related tables (users, leagues, seasons, teams, etc.).
   * Depends on Pokemon data being initialized first.
   */
  async createMockData(): Promise<void> {
    // TODO: Implement mock data creation
  }
}
