import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import passport from 'passport';
import { createClient } from 'redis';
import RedisStore from 'connect-redis';
import swaggerUi from 'swagger-ui-express';
import { errorMiddleware } from './middleware/error.middleware';
import { APP_CONFIG } from './config/app.config';
import { swaggerSpec } from './config/swagger.config';
import { configurePassport } from './config/passport.config';
import { AuthController } from './controllers/auth.controller';
import { LeagueController } from './controllers/league.controller';
import { UserService } from './services/user.service';
import { LeagueService } from './services/league.service';
import { PokemonService } from './services/pokemon.service';
import { Container } from 'typedi';
import AppDataSource from './config/database.config';
import { UserController } from './controllers/user.controller';
import { PokemonController } from './controllers/pokemon.controller';
import { AbilityService } from './services/ability.service';
import { AbilityController } from './controllers/ability.controller';
import { GameStatService } from './services/game-stat.service';
import { GameStatController } from './controllers/game-stat.controller';
import { GameService } from './services/game.service';
import { GameController } from './controllers/game.controller';
import { GenerationController } from './controllers/generation.controller';
import { GenerationService } from './services/generation.service';
import { LeagueUserController } from './controllers/league-user.controller';
import { LeagueUserService } from './services/league-user.service';
import { MatchTeamController } from './controllers/match-team.controller';
import { MatchTeamService } from './services/match-team.service';
import { MatchController } from './controllers/match.controller';
import { MatchService } from './services/match.service';
import { MoveController } from './controllers/move.controller';
import { MoveService } from './services/move.service';
import { PokemonMoveController } from './controllers/pokemon-move.controller';
import { PokemonMoveService } from './services/pokemon-move.service';
import { PokemonTypeController } from './controllers/pokemon-type.controller';
import { PokemonTypeService } from './services/pokemon-type.service';
import { SeasonPokemonController } from './controllers/season-pokemon.controller';
import { SeasonPokemonService } from './services/season-pokemon.service';
import { SeasonController } from './controllers/season.controller';
import { SeasonService } from './services/season.service';
import { TeamController } from './controllers/team.controller';
import { TeamService } from './services/team.service';
import { TypeEffectiveController } from './controllers/type-effective.controller';
import { TypeEffectiveService } from './services/type-effective.service';
import { WeekController } from './controllers/week.controller';
import { WeekService } from './services/week.service';

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
    await this.initializeSwagger();
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

  private async initializeSwagger(): Promise<void> {
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Draftmons API Documentation',
    }));
  }

  private async initializeControllers(): Promise<void> {
    // Create and set up controllers
    const authController = new AuthController();
    const abilityService = Container.get(AbilityService);
    const abilityController = new AbilityController(abilityService);
    const gameStatService = Container.get(GameStatService);
    const gameStatController = new GameStatController(gameStatService);
    const gameService = Container.get(GameService);
    const gameController = new GameController(gameService);
    const generationService = Container.get(GenerationService);
    const generationController = new GenerationController(generationService);
    const leagueUserService = Container.get(LeagueUserService);
    const leagueUserController = new LeagueUserController(leagueUserService);
    const leagueService = Container.get(LeagueService);
    const leagueController = new LeagueController(leagueService);
    const matchTeamService = Container.get(MatchTeamService);
    const matchTeamController = new MatchTeamController(matchTeamService);
    const matchService = Container.get(MatchService);
    const matchController = new MatchController(matchService);
    const moveService = Container.get(MoveService);
    const moveController = new MoveController(moveService);
    const pokemonMoveService = Container.get(PokemonMoveService);
    const pokemonMoveController = new PokemonMoveController(pokemonMoveService);
    const pokemonTypeService = Container.get(PokemonTypeService);
    const pokemonTypeController = new PokemonTypeController(pokemonTypeService);
    const pokemonService = Container.get(PokemonService);
    const pokemonController = new PokemonController(pokemonService);
    const seasonPokemonService = Container.get(SeasonPokemonService);
    const seasonPokemonController = new SeasonPokemonController(seasonPokemonService);
    const seasonService = Container.get(SeasonService);
    const seasonController = new SeasonController(seasonService);
    const teamService = Container.get(TeamService);
    const teamController = new TeamController(teamService);
    const typeEffectiveService = Container.get(TypeEffectiveService);
    const typeEffectiveController = new TypeEffectiveController(typeEffectiveService);
    const userController = new UserController(this.userService);
    const weekService = Container.get(WeekService);
    const weekController = new WeekController(weekService);

    // Set up routes
    this.app.use('/api/auth', authController.router);
    this.app.use('/api/ability', abilityController.router);
    this.app.use('/api/game-stat', gameStatController.router);
    this.app.use('/api/game', gameController.router);
    this.app.use('/api/generation', generationController.router);
    this.app.use('/api/league-user', leagueUserController.router);
    this.app.use('/api/league', leagueController.router);
    this.app.use('/api/match-team', matchTeamController.router);
    this.app.use('/api/match', matchController.router);
    this.app.use('/api/move', moveController.router);
    this.app.use('/api/pokemon-move', pokemonMoveController.router);
    this.app.use('/api/pokemon-type', pokemonTypeController.router);
    this.app.use('/api/pokemon', pokemonController.router);
    this.app.use('/api/season-pokemon', seasonPokemonController.router);
    this.app.use('/api/season', seasonController.router);
    this.app.use('/api/team', teamController.router);
    this.app.use('/api/type-effective', typeEffectiveController.router);
    this.app.use('/api/user', userController.router);
    this.app.use('/api/week', weekController.router);

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
