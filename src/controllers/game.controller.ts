import { Request, Router } from 'express';
import { GameService } from '../services/game.service';
import { BaseController } from './base.controller';
import { Game } from '../entities/game.entity';
import { validateDto, validatePartialDto } from '../middleware/validation.middleware';
import { GameInputDto, GameOutputDto } from '../dtos/game.dto';
import { FindOptionsWhere, FindOptionsRelations } from 'typeorm';
import { plainToInstance } from 'class-transformer';

export class GameController extends BaseController<Game, GameInputDto, GameOutputDto> {
  public router = Router();

  constructor(private gameService: GameService) {
    super(gameService, GameOutputDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', this.getAll);
    this.router.get('/:id', this.getById);
    this.router.post('/', validateDto(GameInputDto), this.create);
    this.router.put('/:id', validatePartialDto(GameInputDto), this.update);
    this.router.delete('/:id', this.delete);
  }

  protected getFullTransformGroup(): string[] {
    return ['game.full'];
  }

  protected async getWhere(
    req: Request,
  ): Promise<FindOptionsWhere<Game> | FindOptionsWhere<Game>[] | undefined> {
    return plainToInstance(GameInputDto, req.query, { excludeExtraneousValues: true });
  }

  protected getBaseRelations(): FindOptionsRelations<Game> | undefined {
    return undefined;
  }

  protected getFullRelations(): FindOptionsRelations<Game> | undefined {
    return undefined;
  }

  /**
   * @swagger
   * tags:
   *   name: Game
   *   description: Game management and operations
   *
   * components:
   *   schemas:
   *     Game:
   *       type: object
   *       required:
   *         - id
   *         - matchId
   *         - winningTeamId
   *         - differential
   *         - isActive
   *         - createdAt
   *         - updatedAt
   *       properties:
   *         id:
   *           type: integer
   *           description: Unique identifier of the game
   *           example: 1
   *         matchId:
   *           type: integer
   *           description: ID of the match this game belongs to
   *           example: 10
   *         winningTeamId:
   *           type: integer
   *           description: ID of the team that won this game
   *           example: 5
   *         differential:
   *           type: integer
   *           description: Score differential (remaining Pokemon)
   *           example: 3
   *         replayLink:
   *           type: string
   *           description: URL link to the game replay
   *           example: "https://replay.pokemonshowdown.com/gen9ou-123456789"
   *         isActive:
   *           type: boolean
   *           description: Whether the game is currently active
   *           example: true
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the game was created
   *           example: "2024-01-01T00:00:00.000Z"
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the game was last updated
   *           example: "2024-01-15T12:30:00.000Z"
   *
   *     GameFull:
   *       allOf:
   *         - $ref: '#/components/schemas/Game'
   *         - type: object
   *           properties:
   *             match:
   *               $ref: '#/components/schemas/Match'
   *               description: Full match details for this game
   *             winningTeam:
   *               $ref: '#/components/schemas/Team'
   *               description: Full winning team details
   *             gameStats:
   *               type: array
   *               description: List of game statistics for all Pokemon in this game
   *               items:
   *                 $ref: '#/components/schemas/GameStat'
   *
   *     GameInput:
   *       type: object
   *       required:
   *         - matchId
   *         - winningTeamId
   *         - differential
   *       properties:
   *         matchId:
   *           type: integer
   *           description: ID of the match this game belongs to
   *           example: 10
   *           minimum: 1
   *         winningTeamId:
   *           type: integer
   *           description: ID of the team that won this game
   *           example: 5
   *           minimum: 1
   *         differential:
   *           type: integer
   *           description: Score differential (remaining Pokemon)
   *           example: 3
   *           minimum: 0
   *           maximum: 6
   *         replayLink:
   *           type: string
   *           description: URL link to the game replay
   *           example: "https://replay.pokemonshowdown.com/gen9ou-123456789"
   *
   *     GameUpdateInput:
   *       type: object
   *       properties:
   *         matchId:
   *           type: integer
   *           description: ID of the match this game belongs to
   *           example: 10
   *           minimum: 1
   *         winningTeamId:
   *           type: integer
   *           description: ID of the team that won this game
   *           example: 5
   *           minimum: 1
   *         differential:
   *           type: integer
   *           description: Score differential (remaining Pokemon)
   *           example: 4
   *           minimum: 0
   *           maximum: 6
   *         replayLink:
   *           type: string
   *           description: URL link to the game replay
   *           example: "https://replay.pokemonshowdown.com/gen9ou-987654321"
   */

  /**
   * @swagger
   * /api/game:
   *   get:
   *     tags:
   *       - Game
   *     summary: Get all games
   *     description: Retrieve a list of all games with optional pagination, sorting, and full details
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
   *         description: Field name to sort by (e.g., differential, createdAt)
   *         example: createdAt
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
   *         description: Include full game details (match, winning team, and game stats)
   *     responses:
   *       200:
   *         description: List of games retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 oneOf:
   *                   - $ref: '#/components/schemas/Game'
   *                   - $ref: '#/components/schemas/GameFull'
   *             examples:
   *               basic:
   *                 summary: Basic game list
   *                 value:
   *                   - id: 1
   *                     matchId: 10
   *                     winningTeamId: 5
   *                     differential: 3
   *                     replayLink: "https://replay.pokemonshowdown.com/gen9ou-123456789"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 2
   *                     matchId: 10
   *                     winningTeamId: 6
   *                     differential: 1
   *                     replayLink: "https://replay.pokemonshowdown.com/gen9ou-123456790"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full game details
   *                 value:
   *                   - id: 1
   *                     matchId: 10
   *                     winningTeamId: 5
   *                     differential: 3
   *                     replayLink: "https://replay.pokemonshowdown.com/gen9ou-123456789"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                     match: {}
   *                     winningTeam: {}
   *                     gameStats: []
   *       400:
   *         description: Invalid query parameters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/game/{id}:
   *   get:
   *     tags:
   *       - Game
   *     summary: Get a game by ID
   *     description: Retrieve detailed information about a specific game
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the game
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full game details (match, winning team, and game stats)
   *     responses:
   *       200:
   *         description: Game details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/Game'
   *                 - $ref: '#/components/schemas/GameFull'
   *             examples:
   *               basic:
   *                 summary: Basic game details
   *                 value:
   *                   id: 1
   *                   matchId: 10
   *                   winningTeamId: 5
   *                   differential: 3
   *                   replayLink: "https://replay.pokemonshowdown.com/gen9ou-123456789"
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full game details with relations
   *                 value:
   *                   id: 1
   *                   matchId: 10
   *                   winningTeamId: 5
   *                   differential: 3
   *                   replayLink: "https://replay.pokemonshowdown.com/gen9ou-123456789"
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *                   match: {}
   *                   winningTeam: {}
   *                   gameStats: []
   *       400:
   *         description: Invalid game ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Game not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/game:
   *   post:
   *     tags:
   *       - Game
   *     summary: Create a new game
   *     description: Create a new game record for a match
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GameInput'
   *           examples:
   *             closeGame:
   *               summary: Close game with 1 Pokemon difference
   *               value:
   *                 matchId: 10
   *                 winningTeamId: 5
   *                 differential: 1
   *                 replayLink: "https://replay.pokemonshowdown.com/gen9ou-123456789"
   *             dominantWin:
   *               summary: Dominant win with 5 Pokemon remaining
   *               value:
   *                 matchId: 11
   *                 winningTeamId: 6
   *                 differential: 5
   *                 replayLink: "https://replay.pokemonshowdown.com/gen9ou-987654321"
   *             noReplay:
   *               summary: Game without replay link
   *               value:
   *                 matchId: 12
   *                 winningTeamId: 7
   *                 differential: 2
   *     responses:
   *       201:
   *         description: Game created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Game'
   *             example:
   *               id: 3
   *               matchId: 10
   *               winningTeamId: 5
   *               differential: 1
   *               replayLink: "https://replay.pokemonshowdown.com/gen9ou-123456789"
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
   *               error: "matchId: must be a number; differential: must not be negative"
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
   * /api/game/{id}:
   *   put:
   *     tags:
   *       - Game
   *     summary: Update a game
   *     description: Update an existing game record. All fields are optional for partial updates.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the game
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full game details in the response (match, winning team, and game stats)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GameUpdateInput'
   *           examples:
   *             updateReplay:
   *               summary: Update only the replay link
   *               value:
   *                 replayLink: "https://replay.pokemonshowdown.com/gen9ou-newreplay"
   *             updateDifferential:
   *               summary: Update the differential
   *               value:
   *                 differential: 2
   *             updateMultiple:
   *               summary: Update multiple fields
   *               value:
   *                 winningTeamId: 6
   *                 differential: 4
   *                 replayLink: "https://replay.pokemonshowdown.com/gen9ou-updated"
   *     responses:
   *       200:
   *         description: Game updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/Game'
   *                 - $ref: '#/components/schemas/GameFull'
   *             example:
   *               id: 1
   *               matchId: 10
   *               winningTeamId: 6
   *               differential: 4
   *               replayLink: "https://replay.pokemonshowdown.com/gen9ou-updated"
   *               isActive: true
   *               createdAt: "2024-01-01T00:00:00.000Z"
   *               updatedAt: "2024-01-20T15:00:00.000Z"
   *       400:
   *         description: Invalid game ID format or invalid input data
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
   *         description: Game not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/game/{id}:
   *   delete:
   *     tags:
   *       - Game
   *     summary: Delete a game
   *     description: |
   *       Permanently delete a game record.
   *       This action cannot be undone.
   *       All associated game statistics will also be removed.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the game to delete
   *         example: 1
   *     responses:
   *       204:
   *         description: Game deleted successfully (no content returned)
   *       400:
   *         description: Invalid game ID format
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
   *         description: Game not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Game not found"
   *               statusCode: 404
   *               timestamp: "2024-01-20T16:00:00.000Z"
   */

  /**
   * @swagger
   * /api/league/{leagueId}/game:
   *   get:
   *     tags:
   *       - Game
   *     summary: Get all games
   *     description: Retrieve a list of all games with optional pagination, sorting, and full details
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
   *         description: Field name to sort by (e.g., differential, createdAt)
   *         example: createdAt
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
   *         description: Include full game details (match, winning team, and game stats)
   *     responses:
   *       200:
   *         description: List of games retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 oneOf:
   *                   - $ref: '#/components/schemas/Game'
   *                   - $ref: '#/components/schemas/GameFull'
   *             examples:
   *               basic:
   *                 summary: Basic game list
   *                 value:
   *                   - id: 1
   *                     matchId: 10
   *                     winningTeamId: 5
   *                     differential: 3
   *                     replayLink: "https://replay.pokemonshowdown.com/gen9ou-123456789"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 2
   *                     matchId: 10
   *                     winningTeamId: 6
   *                     differential: 1
   *                     replayLink: "https://replay.pokemonshowdown.com/gen9ou-123456790"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full game details
   *                 value:
   *                   - id: 1
   *                     matchId: 10
   *                     winningTeamId: 5
   *                     differential: 3
   *                     replayLink: "https://replay.pokemonshowdown.com/gen9ou-123456789"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                     match: {}
   *                     winningTeam: {}
   *                     gameStats: []
   *       400:
   *         description: Invalid query parameters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/league/{leagueId}/game/{id}:
   *   get:
   *     tags:
   *       - Game
   *     summary: Get a game by ID
   *     description: Retrieve detailed information about a specific game
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
   *         description: Unique identifier of the game
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full game details (match, winning team, and game stats)
   *     responses:
   *       200:
   *         description: Game details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/Game'
   *                 - $ref: '#/components/schemas/GameFull'
   *             examples:
   *               basic:
   *                 summary: Basic game details
   *                 value:
   *                   id: 1
   *                   matchId: 10
   *                   winningTeamId: 5
   *                   differential: 3
   *                   replayLink: "https://replay.pokemonshowdown.com/gen9ou-123456789"
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full game details with relations
   *                 value:
   *                   id: 1
   *                   matchId: 10
   *                   winningTeamId: 5
   *                   differential: 3
   *                   replayLink: "https://replay.pokemonshowdown.com/gen9ou-123456789"
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *                   match: {}
   *                   winningTeam: {}
   *                   gameStats: []
   *       400:
   *         description: Invalid game ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Game not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/league/{leagueId}/game:
   *   post:
   *     tags:
   *       - Game
   *     summary: Create a new game
   *     description: Create a new game record for a match
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
   *             $ref: '#/components/schemas/GameInput'
   *           examples:
   *             closeGame:
   *               summary: Close game with 1 Pokemon difference
   *               value:
   *                 matchId: 10
   *                 winningTeamId: 5
   *                 differential: 1
   *                 replayLink: "https://replay.pokemonshowdown.com/gen9ou-123456789"
   *             dominantWin:
   *               summary: Dominant win with 5 Pokemon remaining
   *               value:
   *                 matchId: 11
   *                 winningTeamId: 6
   *                 differential: 5
   *                 replayLink: "https://replay.pokemonshowdown.com/gen9ou-987654321"
   *             noReplay:
   *               summary: Game without replay link
   *               value:
   *                 matchId: 12
   *                 winningTeamId: 7
   *                 differential: 2
   *     responses:
   *       201:
   *         description: Game created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Game'
   *             example:
   *               id: 3
   *               matchId: 10
   *               winningTeamId: 5
   *               differential: 1
   *               replayLink: "https://replay.pokemonshowdown.com/gen9ou-123456789"
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
   *               error: "matchId: must be a number; differential: must not be negative"
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
   * /api/league/{leagueId}/game/{id}:
   *   put:
   *     tags:
   *       - Game
   *     summary: Update a game
   *     description: Update an existing game record. All fields are optional for partial updates.
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
   *         description: Unique identifier of the game
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full game details in the response (match, winning team, and game stats)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GameUpdateInput'
   *           examples:
   *             updateReplay:
   *               summary: Update only the replay link
   *               value:
   *                 replayLink: "https://replay.pokemonshowdown.com/gen9ou-newreplay"
   *             updateDifferential:
   *               summary: Update the differential
   *               value:
   *                 differential: 2
   *             updateMultiple:
   *               summary: Update multiple fields
   *               value:
   *                 winningTeamId: 6
   *                 differential: 4
   *                 replayLink: "https://replay.pokemonshowdown.com/gen9ou-updated"
   *     responses:
   *       200:
   *         description: Game updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/Game'
   *                 - $ref: '#/components/schemas/GameFull'
   *             example:
   *               id: 1
   *               matchId: 10
   *               winningTeamId: 6
   *               differential: 4
   *               replayLink: "https://replay.pokemonshowdown.com/gen9ou-updated"
   *               isActive: true
   *               createdAt: "2024-01-01T00:00:00.000Z"
   *               updatedAt: "2024-01-20T15:00:00.000Z"
   *       400:
   *         description: Invalid game ID format or invalid input data
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
   *         description: Game not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/league/{leagueId}/game/{id}:
   *   delete:
   *     tags:
   *       - Game
   *     summary: Delete a game
   *     description: |
   *       Permanently delete a game record.
   *       This action cannot be undone.
   *       All associated game statistics will also be removed.
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
   *         description: Unique identifier of the game to delete
   *         example: 1
   *     responses:
   *       204:
   *         description: Game deleted successfully (no content returned)
   *       400:
   *         description: Invalid game ID format
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
   *         description: Game not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Game not found"
   *               statusCode: 404
   *               timestamp: "2024-01-20T16:00:00.000Z"
   */
}
