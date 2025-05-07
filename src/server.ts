import 'reflect-metadata';
import { App } from './app';
import { APP_CONFIG } from './config/app.config';
import { useContainer } from 'typeorm';
import { Container } from 'typedi';
import AppDataSource from './config/database.config';
import { User } from './entities/user.entity';
import { League } from './entities/league.entity';
import { LeagueUser } from './entities/league-user.entity';
import { Season } from './entities/season.entity';
import { Pokemon } from './entities/pokemon.entity';
import { PokemonMove } from './entities/pokemon-move.entity';
import { TypeEffective } from './entities/type-effective.entity';

async function bootstrap() {
  // Configure TypeORM to use typedi container with fallback options for migrations
  useContainer(Container, { fallbackOnErrors: true, fallback: false });
  
  // Initialize database connection
  try {
    await AppDataSource.initialize();
    console.log('📦 Database connected successfully');

    // Register repositories with TypeORM
    Container.set('UserRepository', AppDataSource.getRepository(User));
    Container.set('LeagueRepository', AppDataSource.getRepository(League));
    Container.set('LeagueUserRepository', AppDataSource.getRepository(LeagueUser));
    Container.set('SeasonRepository', AppDataSource.getRepository(Season));
    Container.set('PokemonRepository', AppDataSource.getRepository(Pokemon));
    Container.set('PokemonMoveRepository', AppDataSource.getRepository(PokemonMove));
    Container.set('TypeEffectiveRepository', AppDataSource.getRepository(TypeEffective));
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }

  // Create and initialize the app
  const app = new App();
  await app.initialize();

  // Start the server
  const server = app.app.listen(APP_CONFIG.port, () => {
    console.log(`🚀 DraftMons API server started on port ${APP_CONFIG.port}`);
    console.log(`🌍 Environment: ${APP_CONFIG.nodeEnv}`);
  });

  // Handle graceful shutdown
  const shutdown = async () => {
    console.log('📢 Shutting down server...');
    server.close(async () => {
      await app.close();
      console.log('👋 Server shut down successfully');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Start the server
bootstrap().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});