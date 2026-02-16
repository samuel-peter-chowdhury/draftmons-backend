import { Request, Router } from 'express';
import { SeasonPokemonTeamService } from '../services/season-pokemon-team.service';
import { BaseController } from './base.controller';
import { SeasonPokemonTeam } from '../entities/season-pokemon-team.entity';
import { validateDto, validatePartialDto } from '../middleware/validation.middleware';
import { isAuthenticated } from '../middleware/auth.middleware';
import { SeasonPokemonTeamInputDto, SeasonPokemonTeamOutputDto } from '../dtos/season-pokemon-team.dto';
import { FindOptionsWhere, FindOptionsRelations } from 'typeorm';
import { plainToInstance } from 'class-transformer';

export class SeasonPokemonTeamController extends BaseController<
  SeasonPokemonTeam,
  SeasonPokemonTeamInputDto,
  SeasonPokemonTeamOutputDto
> {
  public router = Router();

  constructor(private seasonPokemonTeamService: SeasonPokemonTeamService) {
    super(seasonPokemonTeamService, SeasonPokemonTeamOutputDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', this.getAll);
    this.router.get('/:id', this.getById);
    this.router.post('/', isAuthenticated, validateDto(SeasonPokemonTeamInputDto), this.create);
    this.router.put('/:id', isAuthenticated, validatePartialDto(SeasonPokemonTeamInputDto), this.update);
    this.router.delete('/:id', isAuthenticated, this.delete);
  }

  protected getFullTransformGroup(): string[] {
    return ['seasonPokemonTeam.full'];
  }

  protected async getWhere(
    req: Request,
  ): Promise<FindOptionsWhere<SeasonPokemonTeam> | FindOptionsWhere<SeasonPokemonTeam>[] | undefined> {
    return plainToInstance(SeasonPokemonTeamInputDto, req.query, { excludeExtraneousValues: true });
  }

  protected getBaseRelations(): FindOptionsRelations<SeasonPokemonTeam> | undefined {
    return undefined;
  }

  protected getFullRelations(): FindOptionsRelations<SeasonPokemonTeam> | undefined {
    return {
      seasonPokemon: true,
      team: true,
    };
  }

  /**
   * @swagger
   * tags:
   *   name: SeasonPokemonTeam
   *   description: Season Pokemon team assignment management and operations
   *
   * components:
   *   schemas:
   *     SeasonPokemonTeam:
   *       type: object
   *       required:
   *         - id
   *         - seasonPokemonId
   *         - teamId
   *         - isActive
   *         - createdAt
   *         - updatedAt
   *       properties:
   *         id:
   *           type: integer
   *           description: Unique identifier of the season pokemon team assignment
   *           example: 1
   *         seasonPokemonId:
   *           type: integer
   *           description: ID of the associated season pokemon entry
   *           example: 10
   *         teamId:
   *           type: integer
   *           description: ID of the associated team
   *           example: 3
   *         isActive:
   *           type: boolean
   *           description: Whether the assignment is currently active
   *           example: true
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the assignment was created
   *           example: "2024-01-01T00:00:00.000Z"
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the assignment was last updated
   *           example: "2024-01-15T12:30:00.000Z"
   *
   *     SeasonPokemonTeamFull:
   *       allOf:
   *         - $ref: '#/components/schemas/SeasonPokemonTeam'
   *         - type: object
   *           properties:
   *             seasonPokemon:
   *               $ref: '#/components/schemas/SeasonPokemon'
   *               description: Full season pokemon details
   *             team:
   *               $ref: '#/components/schemas/Team'
   *               description: Full team details
   *
   *     SeasonPokemonTeamInput:
   *       type: object
   *       required:
   *         - seasonPokemonId
   *         - teamId
   *       properties:
   *         seasonPokemonId:
   *           type: integer
   *           description: ID of the associated season pokemon entry
   *           example: 10
   *           minimum: 1
   *         teamId:
   *           type: integer
   *           description: ID of the associated team
   *           example: 3
   *           minimum: 1
   *
   *     SeasonPokemonTeamUpdateInput:
   *       type: object
   *       properties:
   *         seasonPokemonId:
   *           type: integer
   *           description: ID of the associated season pokemon entry
   *           example: 10
   *           minimum: 1
   *         teamId:
   *           type: integer
   *           description: ID of the associated team
   *           example: 3
   *           minimum: 1
   */

  /**
   * @swagger
   * /api/season-pokemon-team:
   *   get:
   *     tags:
   *       - SeasonPokemonTeam
   *     summary: Get all season pokemon team assignments
   *     description: Retrieve a list of all season pokemon team assignments with optional pagination, sorting, and full details
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
   *         description: Field name to sort by (e.g., seasonPokemonId, teamId, createdAt)
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
   *         description: Include full details (season pokemon and team information)
   *     responses:
   *       200:
   *         description: List of season pokemon team assignments retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 oneOf:
   *                   - $ref: '#/components/schemas/SeasonPokemonTeam'
   *                   - $ref: '#/components/schemas/SeasonPokemonTeamFull'
   *             examples:
   *               basic:
   *                 summary: Basic season pokemon team list
   *                 value:
   *                   - id: 1
   *                     seasonPokemonId: 10
   *                     teamId: 3
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 2
   *                     seasonPokemonId: 15
   *                     teamId: 3
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full season pokemon team details
   *                 value:
   *                   - id: 1
   *                     seasonPokemonId: 10
   *                     teamId: 3
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                     seasonPokemon: {}
   *                     team: {}
   *       400:
   *         description: Invalid query parameters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/season-pokemon-team/{id}:
   *   get:
   *     tags:
   *       - SeasonPokemonTeam
   *     summary: Get a season pokemon team assignment by ID
   *     description: Retrieve detailed information about a specific season pokemon team assignment
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the season pokemon team assignment
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full details (season pokemon and team information)
   *     responses:
   *       200:
   *         description: Season pokemon team assignment details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/SeasonPokemonTeam'
   *                 - $ref: '#/components/schemas/SeasonPokemonTeamFull'
   *             examples:
   *               basic:
   *                 summary: Basic season pokemon team details
   *                 value:
   *                   id: 1
   *                   seasonPokemonId: 10
   *                   teamId: 3
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full season pokemon team details with relations
   *                 value:
   *                   id: 1
   *                   seasonPokemonId: 10
   *                   teamId: 3
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *                   seasonPokemon: {}
   *                   team: {}
   *       400:
   *         description: Invalid season pokemon team ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Season pokemon team assignment not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/season-pokemon-team:
   *   post:
   *     tags:
   *       - SeasonPokemonTeam
   *     summary: Create a new season pokemon team assignment
   *     description: Assign a season pokemon entry to a team
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SeasonPokemonTeamInput'
   *           examples:
   *             assignPikachu:
   *               summary: Assign Pikachu to Thunder Bolts
   *               value:
   *                 seasonPokemonId: 10
   *                 teamId: 3
   *             assignCharizard:
   *               summary: Assign Charizard to Fire Blazers
   *               value:
   *                 seasonPokemonId: 15
   *                 teamId: 5
   *     responses:
   *       201:
   *         description: Season pokemon team assignment created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SeasonPokemonTeam'
   *             example:
   *               id: 3
   *               seasonPokemonId: 10
   *               teamId: 3
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
   *               error: "seasonPokemonId: must be a number; teamId: must be a number"
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
   * /api/season-pokemon-team/{id}:
   *   put:
   *     tags:
   *       - SeasonPokemonTeam
   *     summary: Update a season pokemon team assignment
   *     description: Update an existing season pokemon team assignment. All fields are optional for partial updates.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the season pokemon team assignment
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full details in the response (season pokemon and team information)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SeasonPokemonTeamUpdateInput'
   *           examples:
   *             updateTeam:
   *               summary: Reassign to a different team
   *               value:
   *                 teamId: 5
   *             updateSeasonPokemon:
   *               summary: Change the season pokemon entry
   *               value:
   *                 seasonPokemonId: 20
   *             updateBoth:
   *               summary: Update both fields
   *               value:
   *                 seasonPokemonId: 20
   *                 teamId: 5
   *     responses:
   *       200:
   *         description: Season pokemon team assignment updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/SeasonPokemonTeam'
   *                 - $ref: '#/components/schemas/SeasonPokemonTeamFull'
   *             example:
   *               id: 1
   *               seasonPokemonId: 20
   *               teamId: 5
   *               isActive: true
   *               createdAt: "2024-01-01T00:00:00.000Z"
   *               updatedAt: "2024-01-20T15:00:00.000Z"
   *       400:
   *         description: Invalid season pokemon team ID format or invalid input data
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
   *         description: Season pokemon team assignment not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/season-pokemon-team/{id}:
   *   delete:
   *     tags:
   *       - SeasonPokemonTeam
   *     summary: Delete a season pokemon team assignment
   *     description: |
   *       Permanently delete a season pokemon team assignment.
   *       This action cannot be undone.
   *       This removes the association between a season pokemon and a team.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the season pokemon team assignment to delete
   *         example: 1
   *     responses:
   *       204:
   *         description: Season pokemon team assignment deleted successfully (no content returned)
   *       400:
   *         description: Invalid season pokemon team ID format
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
   *         description: Season pokemon team assignment not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Season pokemon team assignment not found"
   *               statusCode: 404
   *               timestamp: "2024-01-20T16:00:00.000Z"
   */
}
