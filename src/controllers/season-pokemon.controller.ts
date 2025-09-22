import { Request, Router } from 'express';
import { SeasonPokemonService } from '../services/season-pokemon.service';
import { BaseController } from './base.controller';
import { SeasonPokemon } from '../entities/season-pokemon.entity';
import { validateDto, validatePartialDto } from '../middleware/validation.middleware';
import { SeasonPokemonInputDto, SeasonPokemonOutputDto } from '../dtos/season-pokemon.dto';
import { FindOptionsWhere, FindOptionsRelations } from 'typeorm';
import { plainToInstance } from 'class-transformer';

export class SeasonPokemonController extends BaseController<SeasonPokemon, SeasonPokemonInputDto, SeasonPokemonOutputDto> {
  public router = Router();

  constructor(private seasonPokemonService: SeasonPokemonService) {
    super(seasonPokemonService, SeasonPokemonOutputDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', this.getAll);
    this.router.get('/:id', this.getById);
    this.router.post('/', validateDto(SeasonPokemonInputDto), this.create);
    this.router.put('/:id', validatePartialDto(SeasonPokemonInputDto), this.update);
    this.router.delete('/:id', this.delete);
  }

  protected getFullTransformGroup(): string[] {
    return ['seasonPokemon.full'];
  }

  protected async getWhere(req: Request): Promise<FindOptionsWhere<SeasonPokemon> | undefined> {
    return plainToInstance(SeasonPokemonInputDto, req.query, { excludeExtraneousValues: true });
  }

  protected getBaseRelations(): FindOptionsRelations<SeasonPokemon> | undefined {
    return undefined;
  }

  protected getFullRelations(): FindOptionsRelations<SeasonPokemon> | undefined {
    return undefined;
  }

  /**
   * @swagger
   * tags:
   *   name: SeasonPokemon
   *   description: Season Pokemon management and operations
   * 
   * components:
   *   schemas:
   *     SeasonPokemon:
   *       type: object
   *       required:
   *         - id
   *         - seasonId
   *         - pokemonId
   *         - isActive
   *         - createdAt
   *         - updatedAt
   *       properties:
   *         id:
   *           type: integer
   *           description: Unique identifier of the season pokemon entry
   *           example: 1
   *         seasonId:
   *           type: integer
   *           description: ID of the associated season
   *           example: 1
   *         pokemonId:
   *           type: integer
   *           description: ID of the associated pokemon
   *           example: 25
   *         teamId:
   *           type: integer
   *           nullable: true
   *           description: ID of the team that owns this pokemon in the season
   *           example: 3
   *         condition:
   *           type: string
   *           nullable: true
   *           description: Special condition or note about this pokemon
   *           example: "Mega Evolution allowed"
   *         pointValue:
   *           type: integer
   *           nullable: true
   *           description: Point value of this pokemon in the season
   *           example: 10
   *         isActive:
   *           type: boolean
   *           description: Whether the season pokemon entry is currently active
   *           example: true
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the season pokemon entry was created
   *           example: "2024-01-01T00:00:00.000Z"
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the season pokemon entry was last updated
   *           example: "2024-01-15T12:30:00.000Z"
   *     
   *     SeasonPokemonFull:
   *       allOf:
   *         - $ref: '#/components/schemas/SeasonPokemon'
   *         - type: object
   *           properties:
   *             season:
   *               $ref: '#/components/schemas/Season'
   *               description: Full season details
   *             pokemon:
   *               $ref: '#/components/schemas/Pokemon'
   *               description: Full pokemon details
   *             team:
   *               $ref: '#/components/schemas/Team'
   *               description: Full team details
   *             gameStats:
   *               type: array
   *               description: List of game statistics for this pokemon
   *               items:
   *                 $ref: '#/components/schemas/GameStat'
   *     
   *     SeasonPokemonInput:
   *       type: object
   *       required:
   *         - seasonId
   *         - pokemonId
   *       properties:
   *         seasonId:
   *           type: integer
   *           description: ID of the associated season
   *           example: 1
   *           minimum: 1
   *         pokemonId:
   *           type: integer
   *           description: ID of the associated pokemon
   *           example: 25
   *           minimum: 1
   *         teamId:
   *           type: integer
   *           nullable: true
   *           description: ID of the team that owns this pokemon
   *           example: 3
   *           minimum: 1
   *         condition:
   *           type: string
   *           nullable: true
   *           description: Special condition or note about this pokemon
   *           example: "Mega Evolution allowed"
   *           maxLength: 255
   *         pointValue:
   *           type: integer
   *           nullable: true
   *           description: Point value of this pokemon in the season
   *           example: 10
   *           minimum: 0
   *     
   *     SeasonPokemonUpdateInput:
   *       type: object
   *       properties:
   *         seasonId:
   *           type: integer
   *           description: ID of the associated season
   *           example: 1
   *           minimum: 1
   *         pokemonId:
   *           type: integer
   *           description: ID of the associated pokemon
   *           example: 25
   *           minimum: 1
   *         teamId:
   *           type: integer
   *           nullable: true
   *           description: ID of the team that owns this pokemon
   *           example: 3
   *           minimum: 1
   *         condition:
   *           type: string
   *           nullable: true
   *           description: Special condition or note about this pokemon
   *           example: "Mega Evolution allowed"
   *           maxLength: 255
   *         pointValue:
   *           type: integer
   *           nullable: true
   *           description: Point value of this pokemon in the season
   *           example: 10
   *           minimum: 0
   */

  /**
   * @swagger
   * /api/season-pokemon:
   *   get:
   *     tags:
   *       - SeasonPokemon
   *     summary: Get all season pokemon entries
   *     description: Retrieve a list of all pokemon entries for seasons with optional pagination, sorting, and full details
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
   *         description: Field name to sort by (e.g., seasonId, pokemonId, pointValue)
   *         example: pointValue
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
   *         description: Include full season pokemon details (season, pokemon, team, game stats)
   *     responses:
   *       200:
   *         description: List of season pokemon entries retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 oneOf:
   *                   - $ref: '#/components/schemas/SeasonPokemon'
   *                   - $ref: '#/components/schemas/SeasonPokemonFull'
   *             examples:
   *               basic:
   *                 summary: Basic season pokemon list
   *                 value:
   *                   - id: 1
   *                     seasonId: 1
   *                     pokemonId: 25
   *                     teamId: 3
   *                     condition: "Mega Evolution allowed"
   *                     pointValue: 10
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 2
   *                     seasonId: 1
   *                     pokemonId: 6
   *                     teamId: 3
   *                     condition: null
   *                     pointValue: 15
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *       400:
   *         description: Invalid query parameters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/season-pokemon/{id}:
   *   get:
   *     tags:
   *       - SeasonPokemon
   *     summary: Get a season pokemon entry by ID
   *     description: Retrieve detailed information about a specific season pokemon entry
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the season pokemon entry
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full season pokemon details (season, pokemon, team, game stats)
   *     responses:
   *       200:
   *         description: Season pokemon entry details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/SeasonPokemon'
   *                 - $ref: '#/components/schemas/SeasonPokemonFull'
   *             examples:
   *               basic:
   *                 summary: Basic season pokemon details
   *                 value:
   *                   id: 1
   *                   seasonId: 1
   *                   pokemonId: 25
   *                   teamId: 3
   *                   condition: "Mega Evolution allowed"
   *                   pointValue: 10
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *       400:
   *         description: Invalid season pokemon ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Season pokemon entry not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/season-pokemon:
   *   post:
   *     tags:
   *       - SeasonPokemon
   *     summary: Create a new season pokemon entry
   *     description: Create a new pokemon entry for a season with associated details
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SeasonPokemonInput'
   *           examples:
   *             standard:
   *               summary: Create a standard season pokemon entry
   *               value:
   *                 seasonId: 1
   *                 pokemonId: 25
   *                 teamId: 3
   *                 condition: "Mega Evolution allowed"
   *                 pointValue: 10
   *             minimal:
   *               summary: Create with minimal required fields
   *               value:
   *                 seasonId: 1
   *                 pokemonId: 6
   *     responses:
   *       201:
   *         description: Season pokemon entry created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SeasonPokemon'
   *             example:
   *               id: 3
   *               seasonId: 1
   *               pokemonId: 25
   *               teamId: 3
   *               condition: "Mega Evolution allowed"
   *               pointValue: 10
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
   *               error: "seasonId: must be a number; pokemonId: must be a number"
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
   * /api/season-pokemon/{id}:
   *   put:
   *     tags:
   *       - SeasonPokemon
   *     summary: Update a season pokemon entry
   *     description: Update an existing season pokemon entry. All fields are optional for partial updates.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the season pokemon entry
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full season pokemon details in the response
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SeasonPokemonUpdateInput'
   *           examples:
   *             updateTeam:
   *               summary: Update only the team assignment
   *               value:
   *                 teamId: 5
   *             updateCondition:
   *               summary: Update only the condition
   *               value:
   *                 condition: "Z-Move allowed"
   *             updateMultiple:
   *               summary: Update multiple fields
   *               value:
   *                 teamId: 5
   *                 condition: "Z-Move allowed"
   *                 pointValue: 12
   *     responses:
   *       200:
   *         description: Season pokemon entry updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/SeasonPokemon'
   *                 - $ref: '#/components/schemas/SeasonPokemonFull'
   *             example:
   *               id: 1
   *               seasonId: 1
   *               pokemonId: 25
   *               teamId: 5
   *               condition: "Z-Move allowed"
   *               pointValue: 12
   *               isActive: true
   *               createdAt: "2024-01-01T00:00:00.000Z"
   *               updatedAt: "2024-01-20T15:00:00.000Z"
   *       400:
   *         description: Invalid season pokemon ID format or invalid input data
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
   *         description: Season pokemon entry not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/season-pokemon/{id}:
   *   delete:
   *     tags:
   *       - SeasonPokemon
   *     summary: Delete a season pokemon entry
   *     description: |
   *       Permanently delete a season pokemon entry.
   *       This action cannot be undone.
   *       Note: Ensure no game statistics are associated with this entry before deletion.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the season pokemon entry to delete
   *         example: 1
   *     responses:
   *       204:
   *         description: Season pokemon entry deleted successfully (no content returned)
   *       400:
   *         description: Invalid season pokemon ID format
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
   *         description: Season pokemon entry not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Season pokemon entry not found"
   *               statusCode: 404
   *               timestamp: "2024-01-20T16:00:00.000Z"
   */

  /**
   * @swagger
   * /api/league/{leagueId}/season-pokemon:
   *   get:
   *     tags:
   *       - SeasonPokemon
   *     summary: Get all season pokemon entries
   *     description: Retrieve a list of all pokemon entries for seasons with optional pagination, sorting, and full details
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
   *         description: Field name to sort by (e.g., seasonId, pokemonId, pointValue)
   *         example: pointValue
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
   *         description: Include full season pokemon details (season, pokemon, team, game stats)
   *     responses:
   *       200:
   *         description: List of season pokemon entries retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 oneOf:
   *                   - $ref: '#/components/schemas/SeasonPokemon'
   *                   - $ref: '#/components/schemas/SeasonPokemonFull'
   *             examples:
   *               basic:
   *                 summary: Basic season pokemon list
   *                 value:
   *                   - id: 1
   *                     seasonId: 1
   *                     pokemonId: 25
   *                     teamId: 3
   *                     condition: "Mega Evolution allowed"
   *                     pointValue: 10
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 2
   *                     seasonId: 1
   *                     pokemonId: 6
   *                     teamId: 3
   *                     condition: null
   *                     pointValue: 15
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *       400:
   *         description: Invalid query parameters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/league/{leagueId}/season-pokemon/{id}:
   *   get:
   *     tags:
   *       - SeasonPokemon
   *     summary: Get a season pokemon entry by ID
   *     description: Retrieve detailed information about a specific season pokemon entry
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
   *         description: Unique identifier of the season pokemon entry
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full season pokemon details (season, pokemon, team, game stats)
   *     responses:
   *       200:
   *         description: Season pokemon entry details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/SeasonPokemon'
   *                 - $ref: '#/components/schemas/SeasonPokemonFull'
   *             examples:
   *               basic:
   *                 summary: Basic season pokemon details
   *                 value:
   *                   id: 1
   *                   seasonId: 1
   *                   pokemonId: 25
   *                   teamId: 3
   *                   condition: "Mega Evolution allowed"
   *                   pointValue: 10
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *       400:
   *         description: Invalid season pokemon ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Season pokemon entry not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/league/{leagueId}/season-pokemon:
   *   post:
   *     tags:
   *       - SeasonPokemon
   *     summary: Create a new season pokemon entry
   *     description: Create a new pokemon entry for a season with associated details
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
   *             $ref: '#/components/schemas/SeasonPokemonInput'
   *           examples:
   *             standard:
   *               summary: Create a standard season pokemon entry
   *               value:
   *                 seasonId: 1
   *                 pokemonId: 25
   *                 teamId: 3
   *                 condition: "Mega Evolution allowed"
   *                 pointValue: 10
   *             minimal:
   *               summary: Create with minimal required fields
   *               value:
   *                 seasonId: 1
   *                 pokemonId: 6
   *     responses:
   *       201:
   *         description: Season pokemon entry created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SeasonPokemon'
   *             example:
   *               id: 3
   *               seasonId: 1
   *               pokemonId: 25
   *               teamId: 3
   *               condition: "Mega Evolution allowed"
   *               pointValue: 10
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
   *               error: "seasonId: must be a number; pokemonId: must be a number"
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
   * /api/league/{leagueId}/season-pokemon/{id}:
   *   put:
   *     tags:
   *       - SeasonPokemon
   *     summary: Update a season pokemon entry
   *     description: Update an existing season pokemon entry. All fields are optional for partial updates.
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
   *         description: Unique identifier of the season pokemon entry
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full season pokemon details in the response
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SeasonPokemonUpdateInput'
   *           examples:
   *             updateTeam:
   *               summary: Update only the team assignment
   *               value:
   *                 teamId: 5
   *             updateCondition:
   *               summary: Update only the condition
   *               value:
   *                 condition: "Z-Move allowed"
   *             updateMultiple:
   *               summary: Update multiple fields
   *               value:
   *                 teamId: 5
   *                 condition: "Z-Move allowed"
   *                 pointValue: 12
   *     responses:
   *       200:
   *         description: Season pokemon entry updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/SeasonPokemon'
   *                 - $ref: '#/components/schemas/SeasonPokemonFull'
   *             example:
   *               id: 1
   *               seasonId: 1
   *               pokemonId: 25
   *               teamId: 5
   *               condition: "Z-Move allowed"
   *               pointValue: 12
   *               isActive: true
   *               createdAt: "2024-01-01T00:00:00.000Z"
   *               updatedAt: "2024-01-20T15:00:00.000Z"
   *       400:
   *         description: Invalid season pokemon ID format or invalid input data
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
   *         description: Season pokemon entry not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/league/{leagueId}/season-pokemon/{id}:
   *   delete:
   *     tags:
   *       - SeasonPokemon
   *     summary: Delete a season pokemon entry
   *     description: |
   *       Permanently delete a season pokemon entry.
   *       This action cannot be undone.
   *       Note: Ensure no game statistics are associated with this entry before deletion.
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
   *         description: Unique identifier of the season pokemon entry to delete
   *         example: 1
   *     responses:
   *       204:
   *         description: Season pokemon entry deleted successfully (no content returned)
   *       400:
   *         description: Invalid season pokemon ID format
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
   *         description: Season pokemon entry not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Season pokemon entry not found"
   *               statusCode: 404
   *               timestamp: "2024-01-20T16:00:00.000Z"
   */
}