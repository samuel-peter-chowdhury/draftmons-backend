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
import { apiLimiter } from './middleware/rate-limit.middleware';
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
import { MatchController } from './controllers/match.controller';
import { MatchService } from './services/match.service';
import { MoveController } from './controllers/move.controller';
import { MoveService } from './services/move.service';
import { SeasonPokemonTeamController } from './controllers/season-pokemon-team.controller';
import { SeasonPokemonTeamService } from './services/season-pokemon-team.service';
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
import { isAdmin, isAuthReadAdminWrite, isAuthReadLeagueModWrite } from './middleware/auth.middleware';
import { SpecialMoveCategoryService } from './services/special-move-category.service';
import { SpecialMoveCategoryController } from './controllers/special-move-category.controller';
import { AdminService } from './services/admin.service';
import { AdminController } from './controllers/admin.controller';

export class App {
  public app: Application;
  private redisClient: ReturnType<typeof createClient>;
  private adminService: AdminService;
  private abilityService: AbilityService;
  private gameStatService: GameStatService;
  private gameService: GameService;
  private generationService: GenerationService;
  private leagueUserService: LeagueUserService;
  private leagueService: LeagueService;
  private matchService: MatchService;
  private moveService: MoveService;
  private seasonPokemonTeamService: SeasonPokemonTeamService;
  private pokemonTypeService: PokemonTypeService;
  private pokemonService: PokemonService;
  private seasonPokemonService: SeasonPokemonService;
  private seasonService: SeasonService;
  private specialMoveCategoryService: SpecialMoveCategoryService;
  private teamService: TeamService;
  private typeEffectiveService: TypeEffectiveService;
  private userService: UserService;
  private weekService: WeekService;

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
    this.app.use(apiLimiter);
    this.app.use(
      cors({
        origin: APP_CONFIG.isProduction
          ? [/\.draftmons\.com$/]
          : ['http://localhost:3333', 'http://localhost:3000'],
        credentials: true,
      }),
    );
    this.app.use(morgan(APP_CONFIG.isProduction ? 'combined' : 'dev'));

    // Body parsing middleware
    this.app.use(express.json({ limit: '1mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  }

  private async initializeSession(): Promise<void> {
    if (APP_CONFIG.isProduction) {
      await this.initializeRedis();
    } else {
      // Use MemoryStore for development
      this.app.use(
        session({
          secret: APP_CONFIG.sessionSecret,
          resave: false,
          saveUninitialized: false,
          cookie: {
            secure: false,
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000, // 1 day
          },
        }),
      );
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

    this.app.use(
      session({
        store: redisStore,
        secret: APP_CONFIG.sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: APP_CONFIG.isProduction,
          httpOnly: true,
          sameSite: APP_CONFIG.isProduction ? 'none' : 'lax',
          maxAge: 24 * 60 * 60 * 1000, // 1 day
        },
      }),
    );
  }

  private async initializeServices(): Promise<void> {
    // Initialize services
    this.adminService = Container.get(AdminService);
    this.abilityService = Container.get(AbilityService);
    this.gameStatService = Container.get(GameStatService);
    this.gameService = Container.get(GameService);
    this.generationService = Container.get(GenerationService);
    this.leagueUserService = Container.get(LeagueUserService);
    this.leagueService = Container.get(LeagueService);
    this.matchService = Container.get(MatchService);
    this.moveService = Container.get(MoveService);
    this.seasonPokemonTeamService = Container.get(SeasonPokemonTeamService);
    this.pokemonTypeService = Container.get(PokemonTypeService);
    this.pokemonService = Container.get(PokemonService);
    this.seasonPokemonService = Container.get(SeasonPokemonService);
    this.seasonService = Container.get(SeasonService);
    this.specialMoveCategoryService = Container.get(SpecialMoveCategoryService);
    this.teamService = Container.get(TeamService);
    this.typeEffectiveService = Container.get(TypeEffectiveService);
    this.userService = Container.get(UserService);
    this.weekService = Container.get(WeekService);
  }

  private async initializePassport(): Promise<void> {
    // Configure passport with Google OAuth
    configurePassport(this.userService);
  }

  private async initializeSwagger(): Promise<void> {
    if (APP_CONFIG.isProduction) return;

    this.app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Draftmons API Documentation',
      }),
    );
  }

  private async initializeControllers(): Promise<void> {
    // Create and set up controllers
    const adminController = new AdminController(this.adminService);
    const authController = new AuthController();
    const abilityController = new AbilityController(this.abilityService);
    const gameStatController = new GameStatController(this.gameStatService);
    const gameController = new GameController(this.gameService);
    const generationController = new GenerationController(this.generationService);
    const leagueUserController = new LeagueUserController(this.leagueUserService);
    const leagueController = new LeagueController(this.leagueService, this.leagueUserService);
    const matchController = new MatchController(this.matchService);
    const moveController = new MoveController(this.moveService);
    const seasonPokemonTeamController = new SeasonPokemonTeamController(this.seasonPokemonTeamService);
    const pokemonTypeController = new PokemonTypeController(this.pokemonTypeService);
    const pokemonController = new PokemonController(this.pokemonService);
    const seasonPokemonController = new SeasonPokemonController(this.seasonPokemonService);
    const seasonController = new SeasonController(this.seasonService);
    const specialMoveCategoryController = new SpecialMoveCategoryController(this.specialMoveCategoryService);
    const teamController = new TeamController(this.teamService);
    const typeEffectiveController = new TypeEffectiveController(this.typeEffectiveService);
    const userController = new UserController(this.userService);
    const weekController = new WeekController(this.weekService);

    // Set up Admin routes
    this.app.use('/api/admin', isAdmin, adminController.router);

    // Set up Auth routes
    this.app.use('/api/auth', authController.router);

    // Set up Admin data routes
    this.app.use('/api/ability', isAuthReadAdminWrite, abilityController.router);
    this.app.use('/api/game-stat', isAuthReadAdminWrite, gameStatController.router);
    this.app.use('/api/game', isAuthReadAdminWrite, gameController.router);
    this.app.use('/api/generation', isAuthReadAdminWrite, generationController.router);
    this.app.use('/api/league-user', isAuthReadAdminWrite, leagueUserController.router);
    this.app.use('/api/match', isAuthReadAdminWrite, matchController.router);
    this.app.use('/api/move', isAuthReadAdminWrite, moveController.router);
    this.app.use('/api/season-pokemon-team', isAuthReadAdminWrite, seasonPokemonTeamController.router);
    this.app.use('/api/pokemon-type', isAuthReadAdminWrite, pokemonTypeController.router);
    this.app.use('/api/pokemon', isAuthReadAdminWrite, pokemonController.router);
    this.app.use('/api/season-pokemon', isAuthReadAdminWrite, seasonPokemonController.router);
    this.app.use('/api/season', isAuthReadAdminWrite, seasonController.router);
    this.app.use('/api/special-move-category', isAuthReadAdminWrite, specialMoveCategoryController.router);
    this.app.use('/api/team', isAuthReadAdminWrite, teamController.router);
    this.app.use('/api/type-effective', isAuthReadAdminWrite, typeEffectiveController.router);
    this.app.use('/api/user', userController.router);
    this.app.use('/api/week', isAuthReadAdminWrite, weekController.router);

    // Set up League routes
    this.app.use('/api/league', leagueController.router);
    this.app.use(
      '/api/league/:leagueId/game-stat',
      isAuthReadLeagueModWrite(),
      gameStatController.router,
    );
    this.app.use('/api/league/:leagueId/game', isAuthReadLeagueModWrite(), gameController.router);
    this.app.use(
      '/api/league/:leagueId/league-user',
      isAuthReadLeagueModWrite(),
      leagueUserController.router,
    );
    this.app.use('/api/league/:leagueId/match', isAuthReadLeagueModWrite(), matchController.router);
    this.app.use(
      '/api/league/:leagueId/season-pokemon',
      isAuthReadLeagueModWrite(),
      seasonPokemonController.router,
    );
    this.app.use(
      '/api/league/:leagueId/season',
      isAuthReadLeagueModWrite(),
      seasonController.router,
    );
    this.app.use('/api/league/:leagueId/team', isAuthReadLeagueModWrite(), teamController.router);
    this.app.use(
      '/api/league/:leagueId/season-pokemon-team',
      isAuthReadLeagueModWrite(),
      seasonPokemonTeamController.router,
    );
    this.app.use('/api/league/:leagueId/week', isAuthReadLeagueModWrite(), weekController.router);

    // Health check route
    this.app.get('/health', async (req, res) => {
      try {
        await AppDataSource.query('SELECT 1');
        res.json({ status: 'ok', db: 'connected', time: new Date().toISOString() });
      } catch {
        res.status(503).json({ status: 'error', db: 'disconnected', time: new Date().toISOString() });
      }
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
