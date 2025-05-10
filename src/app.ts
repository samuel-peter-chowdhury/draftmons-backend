import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import passport from 'passport';
import { createClient } from 'redis';
import RedisStore from 'connect-redis';
import { errorMiddleware } from './middleware/error.middleware';
import { APP_CONFIG } from './config/app.config';
import { configurePassport } from './config/passport.config';
import { AuthController } from './controllers/auth.controller';
import { UserController } from './controllers/user.controller';
import { LeagueController } from './controllers/league.controller';
import { PokemonController } from './controllers/pokemon.controller';
import { UserService } from './services/user.service';
import { LeagueService } from './services/league.service';
import { PokemonService } from './services/pokemon.service';
import { Container } from 'typedi';
import AppDataSource from './config/database.config';

export class App {
  public app: Application;
  private redisClient: ReturnType<typeof createClient>;
  private userService: UserService;

  constructor() {
    this.app = express();
  }

  public async initialize(): Promise<void> {
    await this.initializeMiddlewares();
    await this.initializeServices();
    await this.initializePassport();
    await this.initializeSession();
    await this.initializeControllers();
    await this.initializeErrorHandling();
  }

  private async initializeMiddlewares(): Promise<void> {
    // Security and logging middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: APP_CONFIG.isProduction ? [/\.draftmons\.com$/] : true,
      credentials: true,
    }));
    this.app.use(morgan(APP_CONFIG.isProduction ? 'combined' : 'dev'));

    // Body parsing middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private async initializeSession(): Promise<void> {
    if (APP_CONFIG.isProduction) {
      await this.initializeRedis();
    } else {
      // Use MemoryStore for development
      this.app.use(session({
        secret: APP_CONFIG.sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: false, // Set to false in development
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000, // 1 day
        },
      }));
    }

    // Initialize passport middleware
    this.app.use(passport.initialize());
    this.app.use(passport.session());
  }

  private async initializeRedis(): Promise<void> {
    // Initialize Redis for session storage
    this.redisClient = createClient({
      url: `redis://${APP_CONFIG.redis.host}:${APP_CONFIG.redis.port}`,
      password: APP_CONFIG.redis.password || undefined,
    });

    try {
      await this.redisClient.connect();
      console.log('📦 Redis connected successfully');
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      throw error; // In production, we want to fail if Redis is not available
    }

    // Session middleware with Redis store
    const redisStore = new RedisStore({
      client: this.redisClient,
      prefix: 'draftmons:session:',
    });

    this.app.use(session({
      store: redisStore,
      secret: APP_CONFIG.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: APP_CONFIG.isProduction,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      },
    }));
  }

  private async initializeServices(): Promise<void> {
    // Initialize services
    this.userService = Container.get(UserService);
  }

  private async initializePassport(): Promise<void> {
    // Configure passport with Google OAuth
    configurePassport(this.userService);
  }

  private async initializeControllers(): Promise<void> {
    // Create and set up controllers
    const authController = new AuthController();
    const userController = new UserController(this.userService);
    const leagueService = Container.get(LeagueService);
    const leagueController = new LeagueController(leagueService);
    const pokemonService = Container.get(PokemonService);
    const pokemonController = new PokemonController(pokemonService);

    // Set up routes
    this.app.use('/api/auth', authController.router);
    this.app.use('/api/users', userController.router);
    this.app.use('/api/leagues', leagueController.router);
    this.app.use('/api/pokemon', pokemonController.router);

    // Health check route
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', time: new Date().toISOString() });
    });
  }

  private async initializeErrorHandling(): Promise<void> {
    // Global error handler middleware
    this.app.use(errorMiddleware);
  }

  public async close(): Promise<void> {
    // Close database and Redis connections
    if (this.redisClient) {
      await this.redisClient.disconnect();
    }
    await AppDataSource.destroy();
  }
}
