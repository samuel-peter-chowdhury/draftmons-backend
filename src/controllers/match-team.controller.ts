import { Request, Router } from 'express';
import { MatchTeamService } from '../services/match-team.service';
import { BaseController } from './base.controller';
import { MatchTeam } from '../entities/match-team.entity';
import { validateDto, validatePartialDto } from '../middleware/validation.middleware';
import { isAuthenticated } from '../middleware/auth.middleware';
import { MatchTeamInputDto, MatchTeamOutputDto } from '../dtos/match-team.dto';
import { FindOptionsWhere, FindOptionsRelations } from 'typeorm';
import { plainToInstance } from 'class-transformer';

export class MatchTeamController extends BaseController<MatchTeam, MatchTeamInputDto, MatchTeamOutputDto> {
  public router = Router();

  constructor(private matchTeamService: MatchTeamService) {
    super(matchTeamService, MatchTeamOutputDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Public match team routes
    this.router.get('/', this.getAll);
    this.router.get('/:id', this.getById);

    // Authenticated routes
    this.router.post('/', isAuthenticated, validateDto(MatchTeamInputDto), this.create);
    this.router.put('/:id', isAuthenticated, validatePartialDto(MatchTeamInputDto), this.update);
    this.router.delete('/:id', isAuthenticated, this.delete);
  }

  protected getFullTransformGroup(): string[] {
    return ['matchTeam.full'];
  }

  protected async getWhere(req: Request): Promise<FindOptionsWhere<MatchTeam> | undefined> {
    return plainToInstance(MatchTeamInputDto, req.query);
  }

  protected getBaseRelations(): FindOptionsRelations<MatchTeam> | undefined {
    return undefined;
  }

  protected getFullRelations(): FindOptionsRelations<MatchTeam> | undefined {
    return undefined;
  }

  /**
   * @swagger
   * tags:
   *   name: MatchTeam
   *   description: Match team management and operations
   * 
   * components:
   *   schemas:
   *     MatchTeam:
   *       type: object
   *       required:
   *         - id
   *         - matchId
   *         - teamId
   *         - status
   *         - isActive
   *         - createdAt
   *         - updatedAt
   *       properties:
   *         id:
   *           type: integer
   *           description: Unique identifier of the match team entry
   *           example: 1
   *         matchId:
   *           type: integer
   *           description: ID of the match
   *           example: 10
   *         teamId:
   *           type: integer
   *           description: ID of the team
   *           example: 5
   *         status:
   *           type: string
   *           description: Status of the team in the match (WINNER or LOSER)
   *           enum: [WINNER, LOSER]
   *           example: "WINNER"
   *         isActive:
   *           type: boolean
   *           description: Whether the match team entry is currently active
   *           example: true
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the match team was created
   *           example: "2024-01-01T00:00:00.000Z"
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the match team was last updated
   *           example: "2024-01-15T12:30:00.000Z"
   *     
   *     MatchTeamFull:
   *       allOf:
   *         - $ref: '#/components/schemas/MatchTeam'
   *         - type: object
   *           properties:
   *             match:
   *               $ref: '#/components/schemas/Match'
   *               description: Full match details
   *             team:
   *               $ref: '#/components/schemas/Team'
   *               description: Full team details
   *     
   *     MatchTeamInput:
   *       type: object
   *       required:
   *         - matchId
   *         - teamId
   *         - status
   *       properties:
   *         matchId:
   *           type: integer
   *           description: ID of the match
   *           example: 10
   *           minimum: 1
   *         teamId:
   *           type: integer
   *           description: ID of the team
   *           example: 5
   *           minimum: 1
   *         status:
   *           type: string
   *           description: Status of the team in the match
   *           enum: [WINNER, LOSER]
   *           example: "WINNER"
   *     
   *     MatchTeamUpdateInput:
   *       type: object
   *       properties:
   *         matchId:
   *           type: integer
   *           description: ID of the match
   *           example: 10
   *           minimum: 1
   *         teamId:
   *           type: integer
   *           description: ID of the team
   *           example: 5
   *           minimum: 1
   *         status:
   *           type: string
   *           description: Status of the team in the match
   *           enum: [WINNER, LOSER]
   *           example: "LOSER"
   */

  /**
   * @swagger
   * /api/match-team:
   *   get:
   *     tags:
   *       - MatchTeam
   *     summary: Get all match teams
   *     description: Retrieve a list of all match team entries with optional pagination, sorting, and full details
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
   *         description: Field name to sort by (e.g., status, createdAt)
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
   *         description: Include full match team details (match and team information)
   *     responses:
   *       200:
   *         description: List of match teams retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 oneOf:
   *                   - $ref: '#/components/schemas/MatchTeam'
   *                   - $ref: '#/components/schemas/MatchTeamFull'
   *             examples:
   *               basic:
   *                 summary: Basic match team list
   *                 value:
   *                   - id: 1
   *                     matchId: 10
   *                     teamId: 5
   *                     status: "WINNER"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 2
   *                     matchId: 10
   *                     teamId: 6
   *                     status: "LOSER"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full match team details
   *                 value:
   *                   - id: 1
   *                     matchId: 10
   *                     teamId: 5
   *                     status: "WINNER"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                     match: {}
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
   * /api/match-team/{id}:
   *   get:
   *     tags:
   *       - MatchTeam
   *     summary: Get a match team by ID
   *     description: Retrieve detailed information about a specific match team entry
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the match team
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full match team details (match and team information)
   *     responses:
   *       200:
   *         description: Match team details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/MatchTeam'
   *                 - $ref: '#/components/schemas/MatchTeamFull'
   *             examples:
   *               basic:
   *                 summary: Basic match team details
   *                 value:
   *                   id: 1
   *                   matchId: 10
   *                   teamId: 5
   *                   status: "WINNER"
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full match team details with relations
   *                 value:
   *                   id: 1
   *                   matchId: 10
   *                   teamId: 5
   *                   status: "WINNER"
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *                   match: {}
   *                   team: {}
   *       400:
   *         description: Invalid match team ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Match team not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/match-team:
   *   post:
   *     tags:
   *       - MatchTeam
   *     summary: Create a new match team
   *     description: Add a team to a match with their result status
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MatchTeamInput'
   *           examples:
   *             winningTeam:
   *               summary: Add winning team to match
   *               value:
   *                 matchId: 10
   *                 teamId: 5
   *                 status: "WINNER"
   *             losingTeam:
   *               summary: Add losing team to match
   *               value:
   *                 matchId: 10
   *                 teamId: 6
   *                 status: "LOSER"
   *     responses:
   *       201:
   *         description: Match team created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/MatchTeam'
   *             example:
   *               id: 3
   *               matchId: 10
   *               teamId: 5
   *               status: "WINNER"
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
   *               error: "matchId: must be a number; status: must be WINNER or LOSER"
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
   * /api/match-team/{id}:
   *   put:
   *     tags:
   *       - MatchTeam
   *     summary: Update a match team
   *     description: Update an existing match team entry. All fields are optional for partial updates.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the match team
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full match team details in the response (match and team information)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MatchTeamUpdateInput'
   *           examples:
   *             updateStatus:
   *               summary: Update team status
   *               value:
   *                 status: "LOSER"
   *             updateTeam:
   *               summary: Change team
   *               value:
   *                 teamId: 7
   *             updateMultiple:
   *               summary: Update multiple fields
   *               value:
   *                 teamId: 8
   *                 status: "WINNER"
   *     responses:
   *       200:
   *         description: Match team updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/MatchTeam'
   *                 - $ref: '#/components/schemas/MatchTeamFull'
   *             example:
   *               id: 1
   *               matchId: 10
   *               teamId: 8
   *               status: "WINNER"
   *               isActive: true
   *               createdAt: "2024-01-01T00:00:00.000Z"
   *               updatedAt: "2024-01-20T15:00:00.000Z"
   *       400:
   *         description: Invalid match team ID format or invalid input data
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
   *         description: Match team not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/match-team/{id}:
   *   delete:
   *     tags:
   *       - MatchTeam
   *     summary: Delete a match team
   *     description: |
   *       Permanently delete a match team entry.
   *       This action cannot be undone.
   *       Consider the impact on match integrity before deletion.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the match team to delete
   *         example: 1
   *     responses:
   *       204:
   *         description: Match team deleted successfully (no content returned)
   *       400:
   *         description: Invalid match team ID format
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
   *         description: Match team not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Match team not found"
   *               statusCode: 404
   *               timestamp: "2024-01-20T16:00:00.000Z"
   */
}