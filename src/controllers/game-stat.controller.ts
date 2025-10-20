import { Request, Router } from 'express';
import { GameStatService } from '../services/game-stat.service';
import { BaseController } from './base.controller';
import { GameStat } from '../entities/game-stat.entity';
import { validateDto, validatePartialDto } from '../middleware/validation.middleware';
import { GameStatInputDto, GameStatOutputDto } from '../dtos/game-stat.dto';
import { FindOptionsWhere, FindOptionsRelations } from 'typeorm';
import { plainToInstance } from 'class-transformer';

export class GameStatController extends BaseController<
  GameStat,
  GameStatInputDto,
  GameStatOutputDto
> {
  public router = Router();

  constructor(private gameStatService: GameStatService) {
    super(gameStatService, GameStatOutputDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', this.getAll);
    this.router.get('/:id', this.getById);
    this.router.post('/', validateDto(GameStatInputDto), this.create);
    this.router.put('/:id', validatePartialDto(GameStatInputDto), this.update);
    this.router.delete('/:id', this.delete);
  }

  protected getFullTransformGroup(): string[] {
    return ['gameStat.full'];
  }

  protected async getWhere(
    req: Request,
  ): Promise<FindOptionsWhere<GameStat> | FindOptionsWhere<GameStat>[] | undefined> {
    return plainToInstance(GameStatInputDto, req.query, { excludeExtraneousValues: true });
  }

  protected getBaseRelations(): FindOptionsRelations<GameStat> | undefined {
    return undefined;
  }

  protected getFullRelations(): FindOptionsRelations<GameStat> | undefined {
    return undefined;
  }

  /**
   * @swagger
   * tags:
   *   name: GameStat
   *   description: Game statistics management and operations
   *
   * components:
   *   schemas:
   *     GameStat:
   *       type: object
   *       required:
   *         - id
   *         - gameId
   *         - seasonPokemonId
   *         - directKills
   *         - indirectKills
   *         - deaths
   *         - isActive
   *         - createdAt
   *         - updatedAt
   *       properties:
   *         id:
   *           type: integer
   *           description: Unique identifier of the game stat entry
   *           example: 1
   *         gameId:
   *           type: integer
   *           description: ID of the game these stats belong to
   *           example: 42
   *         seasonPokemonId:
   *           type: integer
   *           description: ID of the season Pokemon these stats are for
   *           example: 123
   *         directKills:
   *           type: integer
   *           description: Number of direct knockouts achieved
   *           example: 2
   *           default: 0
   *         indirectKills:
   *           type: integer
   *           description: Number of indirect knockouts achieved (assists, hazards, etc.)
   *           example: 1
   *           default: 0
   *         deaths:
   *           type: integer
   *           description: Number of times this Pokemon was knocked out
   *           example: 0
   *           default: 0
   *         isActive:
   *           type: boolean
   *           description: Whether the game stat is currently active
   *           example: true
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the game stat was created
   *           example: "2024-01-01T00:00:00.000Z"
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the game stat was last updated
   *           example: "2024-01-15T12:30:00.000Z"
   *
   *     GameStatFull:
   *       allOf:
   *         - $ref: '#/components/schemas/GameStat'
   *         - type: object
   *           properties:
   *             game:
   *               $ref: '#/components/schemas/Game'
   *               description: Full game details for this stat entry
   *             seasonPokemon:
   *               $ref: '#/components/schemas/SeasonPokemon'
   *               description: Full season Pokemon details for this stat entry
   *
   *     GameStatInput:
   *       type: object
   *       required:
   *         - gameId
   *         - seasonPokemonId
   *         - directKills
   *         - indirectKills
   *         - deaths
   *       properties:
   *         gameId:
   *           type: integer
   *           description: ID of the game these stats belong to
   *           example: 42
   *           minimum: 1
   *         seasonPokemonId:
   *           type: integer
   *           description: ID of the season Pokemon these stats are for
   *           example: 123
   *           minimum: 1
   *         directKills:
   *           type: integer
   *           description: Number of direct knockouts achieved
   *           example: 2
   *           minimum: 0
   *         indirectKills:
   *           type: integer
   *           description: Number of indirect knockouts achieved
   *           example: 1
   *           minimum: 0
   *         deaths:
   *           type: integer
   *           description: Number of times this Pokemon was knocked out
   *           example: 0
   *           minimum: 0
   *
   *     GameStatUpdateInput:
   *       type: object
   *       properties:
   *         gameId:
   *           type: integer
   *           description: ID of the game these stats belong to
   *           example: 42
   *           minimum: 1
   *         seasonPokemonId:
   *           type: integer
   *           description: ID of the season Pokemon these stats are for
   *           example: 123
   *           minimum: 1
   *         directKills:
   *           type: integer
   *           description: Number of direct knockouts achieved
   *           example: 3
   *           minimum: 0
   *         indirectKills:
   *           type: integer
   *           description: Number of indirect knockouts achieved
   *           example: 2
   *           minimum: 0
   *         deaths:
   *           type: integer
   *           description: Number of times this Pokemon was knocked out
   *           example: 1
   *           minimum: 0
   */

  /**
   * @swagger
   * /api/game-stat:
   *   get:
   *     tags:
   *       - GameStat
   *     summary: Get all game stats
   *     description: Retrieve a list of all game statistics with optional pagination, sorting, and full details
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number for pagination
   *       - in: query
   *         name: pageSize
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 25
   *         description: Number of items per page
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *         description: Field name to sort by (e.g., directKills, deaths, createdAt)
   *         example: directKills
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [ASC, DESC]
   *           default: ASC
   *         description: Sort order (ascending or descending)
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full game stat details (game and season Pokemon information)
   *     responses:
   *       200:
   *         description: List of game stats retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 oneOf:
   *                   - $ref: '#/components/schemas/GameStat'
   *                   - $ref: '#/components/schemas/GameStatFull'
   *             examples:
   *               basic:
   *                 summary: Basic game stat list
   *                 value:
   *                   - id: 1
   *                     gameId: 42
   *                     seasonPokemonId: 123
   *                     directKills: 2
   *                     indirectKills: 1
   *                     deaths: 0
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 2
   *                     gameId: 42
   *                     seasonPokemonId: 124
   *                     directKills: 0
   *                     indirectKills: 0
   *                     deaths: 2
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full game stat details
   *                 value:
   *                   - id: 1
   *                     gameId: 42
   *                     seasonPokemonId: 123
   *                     directKills: 2
   *                     indirectKills: 1
   *                     deaths: 0
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                     game: {}
   *                     seasonPokemon: {}
   *       400:
   *         description: Invalid query parameters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/game-stat/{id}:
   *   get:
   *     tags:
   *       - GameStat
   *     summary: Get a game stat by ID
   *     description: Retrieve detailed information about a specific game statistic entry
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the game stat
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full game stat details (game and season Pokemon information)
   *     responses:
   *       200:
   *         description: Game stat details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/GameStat'
   *                 - $ref: '#/components/schemas/GameStatFull'
   *             examples:
   *               basic:
   *                 summary: Basic game stat details
   *                 value:
   *                   id: 1
   *                   gameId: 42
   *                   seasonPokemonId: 123
   *                   directKills: 2
   *                   indirectKills: 1
   *                   deaths: 0
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full game stat details with relations
   *                 value:
   *                   id: 1
   *                   gameId: 42
   *                   seasonPokemonId: 123
   *                   directKills: 2
   *                   indirectKills: 1
   *                   deaths: 0
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *                   game: {}
   *                   seasonPokemon: {}
   *       400:
   *         description: Invalid game stat ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Game stat not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/game-stat:
   *   post:
   *     tags:
   *       - GameStat
   *     summary: Create a new game stat
   *     description: Create a new game statistic entry to track Pokemon performance in a game
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GameStatInput'
   *           examples:
   *             mvpPerformance:
   *               summary: MVP Pokemon performance
   *               value:
   *                 gameId: 42
   *                 seasonPokemonId: 123
   *                 directKills: 3
   *                 indirectKills: 2
   *                 deaths: 0
   *             supportRole:
   *               summary: Support Pokemon performance
   *               value:
   *                 gameId: 42
   *                 seasonPokemonId: 124
   *                 directKills: 0
   *                 indirectKills: 3
   *                 deaths: 1
   *             strugglingPokemon:
   *               summary: Pokemon that struggled in battle
   *               value:
   *                 gameId: 42
   *                 seasonPokemonId: 125
   *                 directKills: 0
   *                 indirectKills: 0
   *                 deaths: 3
   *     responses:
   *       201:
   *         description: Game stat created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/GameStat'
   *             example:
   *               id: 3
   *               gameId: 42
   *               seasonPokemonId: 123
   *               directKills: 3
   *               indirectKills: 2
   *               deaths: 0
   *               isActive: true
   *               createdAt: "2024-01-20T10:00:00.000Z"
   *               updatedAt: "2024-01-20T10:00:00.000Z"
   *       400:
   *         description: Invalid input data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "gameId: must be a number; directKills: must not be negative"
   *               statusCode: 400
   *               timestamp: "2024-01-20T10:00:00.000Z"
   *       401:
   *         description: User not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Please log in to access this resource"
   *               statusCode: 401
   *               timestamp: "2024-01-20T10:00:00.000Z"
   */

  /**
   * @swagger
   * /api/game-stat/{id}:
   *   put:
   *     tags:
   *       - GameStat
   *     summary: Update a game stat
   *     description: Update an existing game statistic entry. All fields are optional for partial updates.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the game stat
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full game stat details in the response (game and season Pokemon information)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GameStatUpdateInput'
   *           examples:
   *             updateKills:
   *               summary: Update kill statistics
   *               value:
   *                 directKills: 4
   *                 indirectKills: 2
   *             updateDeaths:
   *               summary: Update only deaths
   *               value:
   *                 deaths: 1
   *             updateAll:
   *               summary: Update all statistics
   *               value:
   *                 directKills: 5
   *                 indirectKills: 3
   *                 deaths: 1
   *     responses:
   *       200:
   *         description: Game stat updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/GameStat'
   *                 - $ref: '#/components/schemas/GameStatFull'
   *             example:
   *               id: 1
   *               gameId: 42
   *               seasonPokemonId: 123
   *               directKills: 5
   *               indirectKills: 3
   *               deaths: 1
   *               isActive: true
   *               createdAt: "2024-01-01T00:00:00.000Z"
   *               updatedAt: "2024-01-20T15:00:00.000Z"
   *       400:
   *         description: Invalid game stat ID format or invalid input data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: User not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Please log in to access this resource"
   *               statusCode: 401
   *               timestamp: "2024-01-20T15:00:00.000Z"
   *       404:
   *         description: Game stat not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/game-stat/{id}:
   *   delete:
   *     tags:
   *       - GameStat
   *     summary: Delete a game stat
   *     description: |
   *       Permanently delete a game statistic entry.
   *       This action cannot be undone.
   *       Consider the impact on historical game data before deletion.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the game stat to delete
   *         example: 1
   *     responses:
   *       204:
   *         description: Game stat deleted successfully (no content returned)
   *       400:
   *         description: Invalid game stat ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Invalid ID format"
   *               statusCode: 400
   *               timestamp: "2024-01-20T16:00:00.000Z"
   *       401:
   *         description: User not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Please log in to access this resource"
   *               statusCode: 401
   *               timestamp: "2024-01-20T16:00:00.000Z"
   *       404:
   *         description: Game stat not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Game stat not found"
   *               statusCode: 404
   *               timestamp: "2024-01-20T16:00:00.000Z"
   */

  /**
   * @swagger
   * /api/league/{leagueId}/game-stat:
   *   get:
   *     tags:
   *       - GameStat
   *     summary: Get all game stats
   *     description: Retrieve a list of all game statistics with optional pagination, sorting, and full details
   *     parameters:
   *       - in: path
   *         name: leagueId
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the league
   *         example: 1
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number for pagination
   *       - in: query
   *         name: pageSize
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 25
   *         description: Number of items per page
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *         description: Field name to sort by (e.g., directKills, deaths, createdAt)
   *         example: directKills
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [ASC, DESC]
   *           default: ASC
   *         description: Sort order (ascending or descending)
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full game stat details (game and season Pokemon information)
   *     responses:
   *       200:
   *         description: List of game stats retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 oneOf:
   *                   - $ref: '#/components/schemas/GameStat'
   *                   - $ref: '#/components/schemas/GameStatFull'
   *             examples:
   *               basic:
   *                 summary: Basic game stat list
   *                 value:
   *                   - id: 1
   *                     gameId: 42
   *                     seasonPokemonId: 123
   *                     directKills: 2
   *                     indirectKills: 1
   *                     deaths: 0
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 2
   *                     gameId: 42
   *                     seasonPokemonId: 124
   *                     directKills: 0
   *                     indirectKills: 0
   *                     deaths: 2
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full game stat details
   *                 value:
   *                   - id: 1
   *                     gameId: 42
   *                     seasonPokemonId: 123
   *                     directKills: 2
   *                     indirectKills: 1
   *                     deaths: 0
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                     game: {}
   *                     seasonPokemon: {}
   *       400:
   *         description: Invalid query parameters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/league/{leagueId}/game-stat/{id}:
   *   get:
   *     tags:
   *       - GameStat
   *     summary: Get a game stat by ID
   *     description: Retrieve detailed information about a specific game statistic entry
   *     parameters:
   *       - in: path
   *         name: leagueId
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the league
   *         example: 1
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the game stat
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full game stat details (game and season Pokemon information)
   *     responses:
   *       200:
   *         description: Game stat details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/GameStat'
   *                 - $ref: '#/components/schemas/GameStatFull'
   *             examples:
   *               basic:
   *                 summary: Basic game stat details
   *                 value:
   *                   id: 1
   *                   gameId: 42
   *                   seasonPokemonId: 123
   *                   directKills: 2
   *                   indirectKills: 1
   *                   deaths: 0
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full game stat details with relations
   *                 value:
   *                   id: 1
   *                   gameId: 42
   *                   seasonPokemonId: 123
   *                   directKills: 2
   *                   indirectKills: 1
   *                   deaths: 0
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *                   game: {}
   *                   seasonPokemon: {}
   *       400:
   *         description: Invalid game stat ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Game stat not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/league/{leagueId}/game-stat:
   *   post:
   *     tags:
   *       - GameStat
   *     summary: Create a new game stat
   *     description: Create a new game statistic entry to track Pokemon performance in a game
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: leagueId
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the league
   *         example: 1
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GameStatInput'
   *           examples:
   *             mvpPerformance:
   *               summary: MVP Pokemon performance
   *               value:
   *                 gameId: 42
   *                 seasonPokemonId: 123
   *                 directKills: 3
   *                 indirectKills: 2
   *                 deaths: 0
   *             supportRole:
   *               summary: Support Pokemon performance
   *               value:
   *                 gameId: 42
   *                 seasonPokemonId: 124
   *                 directKills: 0
   *                 indirectKills: 3
   *                 deaths: 1
   *             strugglingPokemon:
   *               summary: Pokemon that struggled in battle
   *               value:
   *                 gameId: 42
   *                 seasonPokemonId: 125
   *                 directKills: 0
   *                 indirectKills: 0
   *                 deaths: 3
   *     responses:
   *       201:
   *         description: Game stat created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/GameStat'
   *             example:
   *               id: 3
   *               gameId: 42
   *               seasonPokemonId: 123
   *               directKills: 3
   *               indirectKills: 2
   *               deaths: 0
   *               isActive: true
   *               createdAt: "2024-01-20T10:00:00.000Z"
   *               updatedAt: "2024-01-20T10:00:00.000Z"
   *       400:
   *         description: Invalid input data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "gameId: must be a number; directKills: must not be negative"
   *               statusCode: 400
   *               timestamp: "2024-01-20T10:00:00.000Z"
   *       401:
   *         description: User not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Please log in to access this resource"
   *               statusCode: 401
   *               timestamp: "2024-01-20T10:00:00.000Z"
   */

  /**
   * @swagger
   * /api/league/{leagueId}/game-stat/{id}:
   *   put:
   *     tags:
   *       - GameStat
   *     summary: Update a game stat
   *     description: Update an existing game statistic entry. All fields are optional for partial updates.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: leagueId
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the league
   *         example: 1
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the game stat
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full game stat details in the response (game and season Pokemon information)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GameStatUpdateInput'
   *           examples:
   *             updateKills:
   *               summary: Update kill statistics
   *               value:
   *                 directKills: 4
   *                 indirectKills: 2
   *             updateDeaths:
   *               summary: Update only deaths
   *               value:
   *                 deaths: 1
   *             updateAll:
   *               summary: Update all statistics
   *               value:
   *                 directKills: 5
   *                 indirectKills: 3
   *                 deaths: 1
   *     responses:
   *       200:
   *         description: Game stat updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/GameStat'
   *                 - $ref: '#/components/schemas/GameStatFull'
   *             example:
   *               id: 1
   *               gameId: 42
   *               seasonPokemonId: 123
   *               directKills: 5
   *               indirectKills: 3
   *               deaths: 1
   *               isActive: true
   *               createdAt: "2024-01-01T00:00:00.000Z"
   *               updatedAt: "2024-01-20T15:00:00.000Z"
   *       400:
   *         description: Invalid game stat ID format or invalid input data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: User not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Please log in to access this resource"
   *               statusCode: 401
   *               timestamp: "2024-01-20T15:00:00.000Z"
   *       404:
   *         description: Game stat not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/league/{leagueId}/game-stat/{id}:
   *   delete:
   *     tags:
   *       - GameStat
   *     summary: Delete a game stat
   *     description: |
   *       Permanently delete a game statistic entry.
   *       This action cannot be undone.
   *       Consider the impact on historical game data before deletion.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: leagueId
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the league
   *         example: 1
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the game stat to delete
   *         example: 1
   *     responses:
   *       204:
   *         description: Game stat deleted successfully (no content returned)
   *       400:
   *         description: Invalid game stat ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Invalid ID format"
   *               statusCode: 400
   *               timestamp: "2024-01-20T16:00:00.000Z"
   *       401:
   *         description: User not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Please log in to access this resource"
   *               statusCode: 401
   *               timestamp: "2024-01-20T16:00:00.000Z"
   *       404:
   *         description: Game stat not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Game stat not found"
   *               statusCode: 404
   *               timestamp: "2024-01-20T16:00:00.000Z"
   */
}
