import { Request, Router } from 'express';
import { SeasonService } from '../services/season.service';
import { BaseController } from './base.controller';
import { Season } from '../entities/season.entity';
import { validateDto, validatePartialDto } from '../middleware/validation.middleware';
import { isAuthenticated } from '../middleware/auth.middleware';
import { SeasonInputDto, SeasonOutputDto } from '../dtos/season.dto';
import { FindOptionsWhere, FindOptionsRelations } from 'typeorm';
import { plainToInstance } from 'class-transformer';

export class SeasonController extends BaseController<Season, SeasonInputDto, SeasonOutputDto> {
  public router = Router();

  constructor(private seasonService: SeasonService) {
    super(seasonService, SeasonOutputDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Public season routes
    this.router.get('/', this.getAll);
    this.router.get('/:id', this.getById);

    // Authenticated routes
    this.router.post('/', isAuthenticated, validateDto(SeasonInputDto), this.create);
    this.router.put('/:id', isAuthenticated, validatePartialDto(SeasonInputDto), this.update);
    this.router.delete('/:id', isAuthenticated, this.delete);
  }

  protected getFullTransformGroup(): string[] {
    return ['season.full'];
  }

  protected async getWhere(req: Request): Promise<FindOptionsWhere<Season> | undefined> {
    return plainToInstance(SeasonInputDto, req.query);
  }

  protected getBaseRelations(): FindOptionsRelations<Season> | undefined {
    return undefined;
  }

  protected getFullRelations(): FindOptionsRelations<Season> | undefined {
    return undefined;
  }

  /**
   * @swagger
   * tags:
   *   name: Season
   *   description: Season management and operations
   * 
   * components:
   *   schemas:
   *     Season:
   *       type: object
   *       required:
   *         - id
   *         - name
   *         - gen
   *         - status
   *         - pointLimit
   *         - maxPointValue
   *         - leagueId
   *         - isActive
   *         - createdAt
   *         - updatedAt
   *       properties:
   *         id:
   *           type: integer
   *           description: Unique identifier of the season
   *           example: 1
   *         name:
   *           type: string
   *           description: Name of the season
   *           example: "Summer 2024"
   *         gen:
   *           type: string
   *           description: Pokemon generation for this season
   *           example: "Gen 9"
   *         status:
   *           type: string
   *           enum: [PRE_DRAFT, DRAFT, PRE_SEASON, REGULAR_SEASON, POST_SEASON, PLAYOFFS]
   *           description: Current status of the season
   *           example: "REGULAR_SEASON"
   *         rules:
   *           type: string
   *           nullable: true
   *           description: Custom rules for this season
   *           example: "No legendary Pokemon allowed"
   *         pointLimit:
   *           type: integer
   *           description: Maximum total point value for a team
   *           example: 100
   *         maxPointValue:
   *           type: integer
   *           description: Maximum point value for a single Pokemon
   *           example: 20
   *         leagueId:
   *           type: integer
   *           description: ID of the associated league
   *           example: 1
   *         isActive:
   *           type: boolean
   *           description: Whether the season is currently active
   *           example: true
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the season was created
   *           example: "2024-01-01T00:00:00.000Z"
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the season was last updated
   *           example: "2024-01-15T12:30:00.000Z"
   *     
   *     SeasonFull:
   *       allOf:
   *         - $ref: '#/components/schemas/Season'
   *         - type: object
   *           properties:
   *             league:
   *               $ref: '#/components/schemas/League'
   *               description: Full league details
   *             teams:
   *               type: array
   *               description: List of teams in this season
   *               items:
   *                 $ref: '#/components/schemas/Team'
   *             weeks:
   *               type: array
   *               description: List of weeks in this season
   *               items:
   *                 $ref: '#/components/schemas/Week'
   *             seasonPokemon:
   *               type: array
   *               description: List of Pokemon available in this season
   *               items:
   *                 $ref: '#/components/schemas/SeasonPokemon'
   *     
   *     SeasonInput:
   *       type: object
   *       required:
   *         - name
   *         - gen
   *         - status
   *         - pointLimit
   *         - maxPointValue
   *         - leagueId
   *       properties:
   *         name:
   *           type: string
   *           description: Name of the season
   *           example: "Summer 2024"
   *           minLength: 1
   *           maxLength: 100
   *         gen:
   *           type: string
   *           description: Pokemon generation for this season
   *           example: "Gen 9"
   *           minLength: 1
   *           maxLength: 50
   *         status:
   *           type: string
   *           enum: [PRE_DRAFT, DRAFT, PRE_SEASON, REGULAR_SEASON, POST_SEASON, PLAYOFFS]
   *           description: Current status of the season
   *           example: "PRE_DRAFT"
   *         rules:
   *           type: string
   *           nullable: true
   *           description: Custom rules for this season
   *           example: "No legendary Pokemon allowed"
   *           maxLength: 500
   *         pointLimit:
   *           type: integer
   *           description: Maximum total point value for a team
   *           example: 100
   *           minimum: 1
   *         maxPointValue:
   *           type: integer
   *           description: Maximum point value for a single Pokemon
   *           example: 20
   *           minimum: 1
   *         leagueId:
   *           type: integer
   *           description: ID of the associated league
   *           example: 1
   *           minimum: 1
   *     
   *     SeasonUpdateInput:
   *       type: object
   *       properties:
   *         name:
   *           type: string
   *           description: Name of the season
   *           example: "Summer 2024"
   *           minLength: 1
   *           maxLength: 100
   *         gen:
   *           type: string
   *           description: Pokemon generation for this season
   *           example: "Gen 9"
   *           minLength: 1
   *           maxLength: 50
   *         status:
   *           type: string
   *           enum: [PRE_DRAFT, DRAFT, PRE_SEASON, REGULAR_SEASON, POST_SEASON, PLAYOFFS]
   *           description: Current status of the season
   *           example: "REGULAR_SEASON"
   *         rules:
   *           type: string
   *           nullable: true
   *           description: Custom rules for this season
   *           example: "No legendary Pokemon allowed"
   *           maxLength: 500
   *         pointLimit:
   *           type: integer
   *           description: Maximum total point value for a team
   *           example: 100
   *           minimum: 1
   *         maxPointValue:
   *           type: integer
   *           description: Maximum point value for a single Pokemon
   *           example: 20
   *           minimum: 1
   *         leagueId:
   *           type: integer
   *           description: ID of the associated league
   *           example: 1
   *           minimum: 1
   */

  /**
   * @swagger
   * /api/season:
   *   get:
   *     tags:
   *       - Season
   *     summary: Get all seasons
   *     description: Retrieve a list of all seasons with optional pagination, sorting, and full details
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
   *         description: Field name to sort by (e.g., name, createdAt, status)
   *         example: name
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
   *         description: Include full season details (league, teams, weeks, seasonPokemon)
   *     responses:
   *       200:
   *         description: List of seasons retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 oneOf:
   *                   - $ref: '#/components/schemas/Season'
   *                   - $ref: '#/components/schemas/SeasonFull'
   *             examples:
   *               basic:
   *                 summary: Basic season list
   *                 value:
   *                   - id: 1
   *                     name: "Summer 2024"
   *                     gen: "Gen 9"
   *                     status: "REGULAR_SEASON"
   *                     rules: "No legendary Pokemon allowed"
   *                     pointLimit: 100
   *                     maxPointValue: 20
   *                     leagueId: 1
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 2
   *                     name: "Fall 2024"
   *                     gen: "Gen 8"
   *                     status: "PRE_DRAFT"
   *                     rules: null
   *                     pointLimit: 120
   *                     maxPointValue: 25
   *                     leagueId: 1
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
   * /api/season/{id}:
   *   get:
   *     tags:
   *       - Season
   *     summary: Get a season by ID
   *     description: Retrieve detailed information about a specific season
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the season
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full season details (league, teams, weeks, seasonPokemon)
   *     responses:
   *       200:
   *         description: Season details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/Season'
   *                 - $ref: '#/components/schemas/SeasonFull'
   *             examples:
   *               basic:
   *                 summary: Basic season details
   *                 value:
   *                   id: 1
   *                   name: "Summer 2024"
   *                   gen: "Gen 9"
   *                   status: "REGULAR_SEASON"
   *                   rules: "No legendary Pokemon allowed"
   *                   pointLimit: 100
   *                   maxPointValue: 20
   *                   leagueId: 1
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *       400:
   *         description: Invalid season ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Season not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/season:
   *   post:
   *     tags:
   *       - Season
   *     summary: Create a new season
   *     description: Create a new season with configuration and rules
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SeasonInput'
   *           examples:
   *             standard:
   *               summary: Create a standard season
   *               value:
   *                 name: "Spring 2025"
   *                 gen: "Gen 9"
   *                 status: "PRE_DRAFT"
   *                 rules: "No legendary Pokemon allowed"
   *                 pointLimit: 100
   *                 maxPointValue: 20
   *                 leagueId: 1
   *             minimal:
   *               summary: Create with minimal required fields
   *               value:
   *                 name: "Winter 2025"
   *                 gen: "Gen 8"
   *                 status: "PRE_DRAFT"
   *                 pointLimit: 120
   *                 maxPointValue: 25
   *                 leagueId: 1
   *     responses:
   *       201:
   *         description: Season created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Season'
   *             example:
   *               id: 3
   *               name: "Spring 2025"
   *               gen: "Gen 9"
   *               status: "PRE_DRAFT"
   *               rules: "No legendary Pokemon allowed"
   *               pointLimit: 100
   *               maxPointValue: 20
   *               leagueId: 1
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
   *               error: "name: must be a string; pointLimit: must be a number"
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
   * /api/season/{id}:
   *   put:
   *     tags:
   *       - Season
   *     summary: Update a season
   *     description: Update an existing season. All fields are optional for partial updates.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the season
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full season details in the response
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SeasonUpdateInput'
   *           examples:
   *             updateStatus:
   *               summary: Update only the status
   *               value:
   *                 status: "PLAYOFFS"
   *             updateRules:
   *               summary: Update only the rules
   *               value:
   *                 rules: "Mega Evolutions and Z-Moves banned"
   *             updateMultiple:
   *               summary: Update multiple fields
   *               value:
   *                 status: "PLAYOFFS"
   *                 rules: "Mega Evolutions and Z-Moves banned"
   *                 pointLimit: 110
   *     responses:
   *       200:
   *         description: Season updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/Season'
   *                 - $ref: '#/components/schemas/SeasonFull'
   *             example:
   *               id: 1
   *               name: "Summer 2024"
   *               gen: "Gen 9"
   *               status: "PLAYOFFS"
   *               rules: "Mega Evolutions and Z-Moves banned"
   *               pointLimit: 110
   *               maxPointValue: 20
   *               leagueId: 1
   *               isActive: true
   *               createdAt: "2024-01-01T00:00:00.000Z"
   *               updatedAt: "2024-01-20T15:00:00.000Z"
   *       400:
   *         description: Invalid season ID format or invalid input data
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
   *         description: Season not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/season/{id}:
   *   delete:
   *     tags:
   *       - Season
   *     summary: Delete a season
   *     description: |
   *       Permanently delete a season.
   *       This action cannot be undone.
   *       Note: Ensure no teams, weeks, or matches are associated with this season before deletion.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the season to delete
   *         example: 1
   *     responses:
   *       204:
   *         description: Season deleted successfully (no content returned)
   *       400:
   *         description: Invalid season ID format
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
   *         description: Season not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Season not found"
   *               statusCode: 404
   *               timestamp: "2024-01-20T16:00:00.000Z"
   */
}