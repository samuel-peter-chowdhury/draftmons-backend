import { Request, Router } from 'express';
import { LeagueService } from '../services/league.service';
import { BaseController } from './base.controller';
import { League } from '../entities/league.entity';
import { validateDto, validatePartialDto } from '../middleware/validation.middleware';
import { isAuthenticated, isLeagueModerator } from '../middleware/auth.middleware';
import { LeagueInputDto, LeagueOutputDto } from '../dtos/league.dto';
import { FindOptionsWhere, FindOptionsRelations } from 'typeorm';
import { plainToInstance } from 'class-transformer';

export class LeagueController extends BaseController<League, LeagueInputDto, LeagueOutputDto> {
  public router = Router();

  constructor(private leagueService: LeagueService) {
    super(leagueService, LeagueOutputDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Public league routes
    this.router.get('/', this.getAll);
    this.router.get('/:id', this.getById);

    // Authenticated routes
    this.router.post('/', isAuthenticated, validateDto(LeagueInputDto), this.create);

    // League moderator routes
    this.router.put('/:id', isAuthenticated, isLeagueModerator(), validatePartialDto(LeagueInputDto), this.update);
    this.router.delete('/:id', isAuthenticated, isLeagueModerator(), this.delete);
  }

  protected getFullTransformGroup(): string[] {
    return ['league.full', 'leagueUser.full'];
  }

  protected async getWhere(req: Request): Promise<FindOptionsWhere<League> | undefined> {
    return plainToInstance(LeagueInputDto, req.query);
  }

  protected getBaseRelations(): FindOptionsRelations<League> | undefined {
    return undefined;
  }

  protected getFullRelations(): FindOptionsRelations<League> | undefined {
    return {
      leagueUsers: {
        user: true
      },
      seasons: true
    }
  }

  /**
   * @swagger
   * tags:
   *   name: League
   *   description: League management and operations
   * 
   * components:
   *   schemas:
   *     League:
   *       type: object
   *       required:
   *         - id
   *         - name
   *         - abbreviation
   *         - isActive
   *         - createdAt
   *         - updatedAt
   *       properties:
   *         id:
   *           type: integer
   *           description: Unique identifier of the league
   *           example: 1
   *         name:
   *           type: string
   *           description: Full name of the league
   *           example: "Pokemon Masters League"
   *         abbreviation:
   *           type: string
   *           description: Short abbreviation for the league
   *           example: "PML"
   *         isActive:
   *           type: boolean
   *           description: Whether the league is currently active
   *           example: true
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the league was created
   *           example: "2024-01-01T00:00:00.000Z"
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the league was last updated
   *           example: "2024-01-15T12:30:00.000Z"
   *     
   *     LeagueFull:
   *       allOf:
   *         - $ref: '#/components/schemas/League'
   *         - type: object
   *           properties:
   *             seasons:
   *               type: array
   *               description: List of seasons associated with this league
   *               items:
   *                 $ref: '#/components/schemas/Season'
   *             leagueUsers:
   *               type: array
   *               description: List of users in this league with their roles
   *               items:
   *                 $ref: '#/components/schemas/LeagueUser'
   *     
   *     LeagueInput:
   *       type: object
   *       required:
   *         - name
   *         - abbreviation
   *       properties:
   *         name:
   *           type: string
   *           description: Full name of the league
   *           example: "Pokemon Masters League"
   *           minLength: 1
   *           maxLength: 255
   *         abbreviation:
   *           type: string
   *           description: Short abbreviation for the league
   *           example: "PML"
   *           minLength: 1
   *           maxLength: 10
   *         password:
   *           type: string
   *           description: Optional password to protect the league (will not be returned in responses)
   *           example: "secretPassword123"
   *     
   *     LeagueUpdateInput:
   *       type: object
   *       properties:
   *         name:
   *           type: string
   *           description: Full name of the league
   *           example: "Pokemon Masters League Updated"
   *           minLength: 1
   *           maxLength: 255
   *         abbreviation:
   *           type: string
   *           description: Short abbreviation for the league
   *           example: "PMLU"
   *           minLength: 1
   *           maxLength: 10
   *         password:
   *           type: string
   *           description: Optional password to protect the league (will not be returned in responses)
   *           example: "newSecretPassword456"
   *     
   *     PaginationParams:
   *       type: object
   *       properties:
   *         page:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *           description: Page number for pagination
   *         pageSize:
   *           type: integer
   *           minimum: 1
   *           default: 25
   *           description: Number of items per page
   *         sortBy:
   *           type: string
   *           description: Field name to sort by
   *           example: "name"
   *         sortOrder:
   *           type: string
   *           enum: [ASC, DESC]
   *           default: ASC
   *           description: Sort order (ascending or descending)
   *     
   *     ErrorResponse:
   *       type: object
   *       properties:
   *         error:
   *           type: string
   *           description: Error message
   *           example: "Resource not found"
   *         statusCode:
   *           type: integer
   *           description: HTTP status code
   *           example: 404
   *         timestamp:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the error occurred
   */

  /**
   * @swagger
   * /api/league:
   *   get:
   *     tags:
   *       - League
   *     summary: Get all leagues
   *     description: Retrieve a list of all leagues with optional pagination, sorting, and full details
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
   *         description: Field name to sort by (e.g., name, createdAt)
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
   *         description: Include full league details (seasons and league users)
   *     responses:
   *       200:
   *         description: List of leagues retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 oneOf:
   *                   - $ref: '#/components/schemas/League'
   *                   - $ref: '#/components/schemas/LeagueFull'
   *             examples:
   *               basic:
   *                 summary: Basic league list
   *                 value:
   *                   - id: 1
   *                     name: "Pokemon Masters League"
   *                     abbreviation: "PML"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full league details
   *                 value:
   *                   - id: 1
   *                     name: "Pokemon Masters League"
   *                     abbreviation: "PML"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                     seasons: []
   *                     leagueUsers: []
   *       400:
   *         description: Invalid query parameters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/league/{id}:
   *   get:
   *     tags:
   *       - League
   *     summary: Get a league by ID
   *     description: Retrieve detailed information about a specific league
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the league
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full league details (seasons and league users)
   *     responses:
   *       200:
   *         description: League details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/League'
   *                 - $ref: '#/components/schemas/LeagueFull'
   *       400:
   *         description: Invalid league ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: League not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/league:
   *   post:
   *     tags:
   *       - League
   *     summary: Create a new league
   *     description: Create a new league. The authenticated user will automatically become the league moderator.
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LeagueInput'
   *           examples:
   *             withPassword:
   *               summary: Create league with password protection
   *               value:
   *                 name: "Elite Pokemon League"
   *                 abbreviation: "EPL"
   *                 password: "secretPassword123"
   *             withoutPassword:
   *               summary: Create public league
   *               value:
   *                 name: "Casual Pokemon League"
   *                 abbreviation: "CPL"
   *     responses:
   *       201:
   *         description: League created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/League'
   *             example:
   *               id: 2
   *               name: "Elite Pokemon League"
   *               abbreviation: "EPL"
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
   *               error: "name: must be a string; abbreviation: must not be empty"
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
   * /api/league/{id}:
   *   put:
   *     tags:
   *       - League
   *     summary: Update a league
   *     description: Update an existing league. Only league moderators or admins can perform this action. All fields are optional.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the league
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full league details in the response (seasons and league users)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LeagueUpdateInput'
   *           examples:
   *             updateName:
   *               summary: Update only the league name
   *               value:
   *                 name: "Pokemon Champions League"
   *             updatePassword:
   *               summary: Update the league password
   *               value:
   *                 password: "newSecurePassword789"
   *             updateMultiple:
   *               summary: Update multiple fields
   *               value:
   *                 name: "Updated League Name"
   *                 abbreviation: "ULN"
   *     responses:
   *       200:
   *         description: League updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/League'
   *                 - $ref: '#/components/schemas/LeagueFull'
   *             example:
   *               id: 1
   *               name: "Pokemon Champions League"
   *               abbreviation: "PML"
   *               isActive: true
   *               createdAt: "2024-01-01T00:00:00.000Z"
   *               updatedAt: "2024-01-20T15:00:00.000Z"
   *       400:
   *         description: Invalid league ID format or invalid input data
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
   *       403:
   *         description: User is not a league moderator or admin
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "League moderator access required"
   *               statusCode: 403
   *               timestamp: "2024-01-20T15:00:00.000Z"
   *       404:
   *         description: League not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/league/{id}:
   *   delete:
   *     tags:
   *       - League
   *     summary: Delete a league
   *     description: |
   *       Permanently delete a league and all its associated data.
   *       Only league moderators or admins can perform this action.
   *       This action cannot be undone.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the league to delete
   *         example: 1
   *     responses:
   *       204:
   *         description: League deleted successfully (no content returned)
   *       400:
   *         description: Invalid league ID format
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
   *       403:
   *         description: User is not a league moderator or admin
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "League moderator access required"
   *               statusCode: 403
   *               timestamp: "2024-01-20T16:00:00.000Z"
   *       404:
   *         description: League not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "League not found"
   *               statusCode: 404
   *               timestamp: "2024-01-20T16:00:00.000Z"
   */
}