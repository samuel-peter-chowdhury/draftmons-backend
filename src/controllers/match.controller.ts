import { Request, Router } from 'express';
import { MatchService } from '../services/match.service';
import { BaseController } from './base.controller';
import { Match } from '../entities/match.entity';
import { validateDto, validatePartialDto } from '../middleware/validation.middleware';
import { MatchInputDto, MatchOutputDto } from '../dtos/match.dto';
import { FindOptionsWhere, FindOptionsRelations } from 'typeorm';
import { plainToInstance } from 'class-transformer';

export class MatchController extends BaseController<Match, MatchInputDto, MatchOutputDto> {
  public router = Router();

  constructor(private matchService: MatchService) {
    super(matchService, MatchOutputDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', this.getAll);
    this.router.get('/:id', this.getById);
    this.router.post('/', validateDto(MatchInputDto), this.create);
    this.router.put('/:id', validatePartialDto(MatchInputDto), this.update);
    this.router.delete('/:id', this.delete);
  }

  protected getFullTransformGroup(): string[] {
    return ['match.full'];
  }

  protected async getWhere(
    req: Request,
  ): Promise<FindOptionsWhere<Match> | FindOptionsWhere<Match>[] | undefined> {
    return plainToInstance(MatchInputDto, req.query, { excludeExtraneousValues: true });
  }

  protected getBaseRelations(): FindOptionsRelations<Match> | undefined {
    return undefined;
  }

  protected getFullRelations(): FindOptionsRelations<Match> | undefined {
    return undefined;
  }

  /**
   * @swagger
   * tags:
   *   name: Match
   *   description: Match management and operations
   *
   * components:
   *   schemas:
   *     Match:
   *       type: object
   *       required:
   *         - id
   *         - weekId
   *         - isActive
   *         - createdAt
   *         - updatedAt
   *       properties:
   *         id:
   *           type: integer
   *           description: Unique identifier of the match
   *           example: 1
   *         weekId:
   *           type: integer
   *           description: ID of the week this match belongs to
   *           example: 5
   *         isActive:
   *           type: boolean
   *           description: Whether the match is currently active
   *           example: true
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the match was created
   *           example: "2024-01-01T00:00:00.000Z"
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the match was last updated
   *           example: "2024-01-15T12:30:00.000Z"
   *
   *     MatchFull:
   *       allOf:
   *         - $ref: '#/components/schemas/Match'
   *         - type: object
   *           properties:
   *             week:
   *               $ref: '#/components/schemas/Week'
   *               description: Full week details for this match
   *             matchTeams:
   *               type: array
   *               description: List of teams in this match
   *               items:
   *                 $ref: '#/components/schemas/MatchTeam'
   *             games:
   *               type: array
   *               description: List of games in this match
   *               items:
   *                 $ref: '#/components/schemas/Game'
   *
   *     MatchInput:
   *       type: object
   *       required:
   *         - weekId
   *       properties:
   *         weekId:
   *           type: integer
   *           description: ID of the week this match belongs to
   *           example: 5
   *           minimum: 1
   *
   *     MatchUpdateInput:
   *       type: object
   *       properties:
   *         weekId:
   *           type: integer
   *           description: ID of the week this match belongs to
   *           example: 6
   *           minimum: 1
   */

  /**
   * @swagger
   * /api/match:
   *   get:
   *     tags:
   *       - Match
   *     summary: Get all matches
   *     description: Retrieve a list of all matches with optional pagination, sorting, and full details
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
   *         description: Field name to sort by (e.g., weekId, createdAt)
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
   *         description: Include full match details (week, teams, and games)
   *     responses:
   *       200:
   *         description: List of matches retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 oneOf:
   *                   - $ref: '#/components/schemas/Match'
   *                   - $ref: '#/components/schemas/MatchFull'
   *             examples:
   *               basic:
   *                 summary: Basic match list
   *                 value:
   *                   - id: 1
   *                     weekId: 5
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 2
   *                     weekId: 5
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full match details
   *                 value:
   *                   - id: 1
   *                     weekId: 5
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                     week: {}
   *                     matchTeams: []
   *                     games: []
   *       400:
   *         description: Invalid query parameters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/match/{id}:
   *   get:
   *     tags:
   *       - Match
   *     summary: Get a match by ID
   *     description: Retrieve detailed information about a specific match
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the match
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full match details (week, teams, and games)
   *     responses:
   *       200:
   *         description: Match details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/Match'
   *                 - $ref: '#/components/schemas/MatchFull'
   *             examples:
   *               basic:
   *                 summary: Basic match details
   *                 value:
   *                   id: 1
   *                   weekId: 5
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full match details with relations
   *                 value:
   *                   id: 1
   *                   weekId: 5
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *                   week: {}
   *                   matchTeams: []
   *                   games: []
   *       400:
   *         description: Invalid match ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Match not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/match:
   *   post:
   *     tags:
   *       - Match
   *     summary: Create a new match
   *     description: Create a new match for a specific week
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MatchInput'
   *           examples:
   *             standard:
   *               summary: Create a standard match
   *               value:
   *                 weekId: 5
   *             playoff:
   *               summary: Create a playoff match
   *               value:
   *                 weekId: 10
   *     responses:
   *       201:
   *         description: Match created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Match'
   *             example:
   *               id: 3
   *               weekId: 5
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
   *               error: "weekId: must be a number"
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
   * /api/match/{id}:
   *   put:
   *     tags:
   *       - Match
   *     summary: Update a match
   *     description: Update an existing match. All fields are optional for partial updates.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the match
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full match details in the response (week, teams, and games)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MatchUpdateInput'
   *           examples:
   *             updateWeek:
   *               summary: Move match to different week
   *               value:
   *                 weekId: 6
   *     responses:
   *       200:
   *         description: Match updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/Match'
   *                 - $ref: '#/components/schemas/MatchFull'
   *             example:
   *               id: 1
   *               weekId: 6
   *               isActive: true
   *               createdAt: "2024-01-01T00:00:00.000Z"
   *               updatedAt: "2024-01-20T15:00:00.000Z"
   *       400:
   *         description: Invalid match ID format or invalid input data
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
   *         description: Match not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/match/{id}:
   *   delete:
   *     tags:
   *       - Match
   *     summary: Delete a match
   *     description: |
   *       Permanently delete a match.
   *       This action cannot be undone.
   *       All associated games and match team entries will also be removed.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the match to delete
   *         example: 1
   *     responses:
   *       204:
   *         description: Match deleted successfully (no content returned)
   *       400:
   *         description: Invalid match ID format
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
   *         description: Match not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Match not found"
   *               statusCode: 404
   *               timestamp: "2024-01-20T16:00:00.000Z"
   */

  /**
   * @swagger
   * /api/league/{leagueId}/match:
   *   get:
   *     tags:
   *       - Match
   *     summary: Get all matches
   *     description: Retrieve a list of all matches with optional pagination, sorting, and full details
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
   *         description: Field name to sort by (e.g., weekId, createdAt)
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
   *         description: Include full match details (week, teams, and games)
   *     responses:
   *       200:
   *         description: List of matches retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 oneOf:
   *                   - $ref: '#/components/schemas/Match'
   *                   - $ref: '#/components/schemas/MatchFull'
   *             examples:
   *               basic:
   *                 summary: Basic match list
   *                 value:
   *                   - id: 1
   *                     weekId: 5
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 2
   *                     weekId: 5
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full match details
   *                 value:
   *                   - id: 1
   *                     weekId: 5
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                     week: {}
   *                     matchTeams: []
   *                     games: []
   *       400:
   *         description: Invalid query parameters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/league/{leagueId}/match/{id}:
   *   get:
   *     tags:
   *       - Match
   *     summary: Get a match by ID
   *     description: Retrieve detailed information about a specific match
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
   *         description: Unique identifier of the match
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full match details (week, teams, and games)
   *     responses:
   *       200:
   *         description: Match details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/Match'
   *                 - $ref: '#/components/schemas/MatchFull'
   *             examples:
   *               basic:
   *                 summary: Basic match details
   *                 value:
   *                   id: 1
   *                   weekId: 5
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full match details with relations
   *                 value:
   *                   id: 1
   *                   weekId: 5
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *                   week: {}
   *                   matchTeams: []
   *                   games: []
   *       400:
   *         description: Invalid match ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Match not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/league/{leagueId}/match:
   *   post:
   *     tags:
   *       - Match
   *     summary: Create a new match
   *     description: Create a new match for a specific week
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
   *             $ref: '#/components/schemas/MatchInput'
   *           examples:
   *             standard:
   *               summary: Create a standard match
   *               value:
   *                 weekId: 5
   *             playoff:
   *               summary: Create a playoff match
   *               value:
   *                 weekId: 10
   *     responses:
   *       201:
   *         description: Match created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Match'
   *             example:
   *               id: 3
   *               weekId: 5
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
   *               error: "weekId: must be a number"
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
   * /api/league/{leagueId}/match/{id}:
   *   put:
   *     tags:
   *       - Match
   *     summary: Update a match
   *     description: Update an existing match. All fields are optional for partial updates.
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
   *         description: Unique identifier of the match
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full match details in the response (week, teams, and games)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MatchUpdateInput'
   *           examples:
   *             updateWeek:
   *               summary: Move match to different week
   *               value:
   *                 weekId: 6
   *     responses:
   *       200:
   *         description: Match updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/Match'
   *                 - $ref: '#/components/schemas/MatchFull'
   *             example:
   *               id: 1
   *               weekId: 6
   *               isActive: true
   *               createdAt: "2024-01-01T00:00:00.000Z"
   *               updatedAt: "2024-01-20T15:00:00.000Z"
   *       400:
   *         description: Invalid match ID format or invalid input data
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
   *         description: Match not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/league/{leagueId}/match/{id}:
   *   delete:
   *     tags:
   *       - Match
   *     summary: Delete a match
   *     description: |
   *       Permanently delete a match.
   *       This action cannot be undone.
   *       All associated games and match team entries will also be removed.
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
   *         description: Unique identifier of the match to delete
   *         example: 1
   *     responses:
   *       204:
   *         description: Match deleted successfully (no content returned)
   *       400:
   *         description: Invalid match ID format
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
   *         description: Match not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Match not found"
   *               statusCode: 404
   *               timestamp: "2024-01-20T16:00:00.000Z"
   */
}
