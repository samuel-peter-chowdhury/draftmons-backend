import { Request, Router } from 'express';
import { WeekService } from '../services/week.service';
import { BaseController } from './base.controller';
import { Week } from '../entities/week.entity';
import { validateDto, validatePartialDto } from '../middleware/validation.middleware';
import { WeekInputDto, WeekOutputDto } from '../dtos/week.dto';
import { FindOptionsWhere, FindOptionsRelations } from 'typeorm';
import { plainToInstance } from 'class-transformer';

export class WeekController extends BaseController<Week, WeekInputDto, WeekOutputDto> {
  public router = Router();

  constructor(private weekService: WeekService) {
    super(weekService, WeekOutputDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', this.getAll);
    this.router.get('/:id', this.getById);
    this.router.post('/', validateDto(WeekInputDto), this.create);
    this.router.put('/:id', validatePartialDto(WeekInputDto), this.update);
    this.router.delete('/:id', this.delete);
  }

  protected getFullTransformGroup(): string[] {
    return ['week.full'];
  }

  protected getAllowedSortFields(): string[] {
    return ['id', 'createdAt', 'updatedAt'];
  }

  protected async getWhere(
    req: Request,
  ): Promise<FindOptionsWhere<Week> | FindOptionsWhere<Week>[] | undefined> {
    return plainToInstance(WeekInputDto, req.query, { excludeExtraneousValues: true });
  }

  protected getBaseRelations(): FindOptionsRelations<Week> | undefined {
    return undefined;
  }

  protected getFullRelations(): FindOptionsRelations<Week> | undefined {
    return undefined;
  }

  /**
   * @swagger
   * tags:
   *   name: Week
   *   description: Week management and operations
   *
   * components:
   *   schemas:
   *     Week:
   *       type: object
   *       required:
   *         - id
   *         - name
   *         - seasonId
   *         - isActive
   *         - createdAt
   *         - updatedAt
   *       properties:
   *         id:
   *           type: integer
   *           description: Unique identifier of the week
   *           example: 1
   *         name:
   *           type: string
   *           description: Name of the week
   *           example: "Week 1"
   *         seasonId:
   *           type: integer
   *           description: ID of the associated season
   *           example: 1
   *         isActive:
   *           type: boolean
   *           description: Whether the week is currently active
   *           example: true
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the week was created
   *           example: "2024-01-01T00:00:00.000Z"
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the week was last updated
   *           example: "2024-01-15T12:30:00.000Z"
   *
   *     WeekFull:
   *       allOf:
   *         - $ref: '#/components/schemas/Week'
   *         - type: object
   *           properties:
   *             season:
   *               $ref: '#/components/schemas/Season'
   *               description: Full season details
   *             matches:
   *               type: array
   *               description: List of matches scheduled for this week
   *               items:
   *                 $ref: '#/components/schemas/Match'
   *
   *     WeekInput:
   *       type: object
   *       required:
   *         - name
   *         - seasonId
   *       properties:
   *         name:
   *           type: string
   *           description: Name of the week
   *           example: "Week 1"
   *           minLength: 1
   *           maxLength: 100
   *         seasonId:
   *           type: integer
   *           description: ID of the associated season
   *           example: 1
   *           minimum: 1
   *
   *     WeekUpdateInput:
   *       type: object
   *       properties:
   *         name:
   *           type: string
   *           description: Name of the week
   *           example: "Week 1"
   *           minLength: 1
   *           maxLength: 100
   *         seasonId:
   *           type: integer
   *           description: ID of the associated season
   *           example: 1
   *           minimum: 1
   */

  /**
   * @swagger
   * /api/week:
   *   get:
   *     tags:
   *       - Week
   *     summary: Get all weeks
   *     description: Retrieve a list of all weeks with optional pagination, sorting, and full details
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
   *         description: Field name to sort by (e.g., name, createdAt, seasonId)
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
   *         description: Include full week details (season and matches)
   *     responses:
   *       200:
   *         description: List of weeks retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 oneOf:
   *                   - $ref: '#/components/schemas/Week'
   *                   - $ref: '#/components/schemas/WeekFull'
   *             examples:
   *               basic:
   *                 summary: Basic week list
   *                 value:
   *                   - id: 1
   *                     name: "Week 1"
   *                     seasonId: 1
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 2
   *                     name: "Week 2"
   *                     seasonId: 1
   *                     isActive: true
   *                     createdAt: "2024-01-08T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 3
   *                     name: "Playoffs - Round 1"
   *                     seasonId: 1
   *                     isActive: true
   *                     createdAt: "2024-01-15T00:00:00.000Z"
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
   * /api/week/{id}:
   *   get:
   *     tags:
   *       - Week
   *     summary: Get a week by ID
   *     description: Retrieve detailed information about a specific week
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the week
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full week details (season and matches)
   *     responses:
   *       200:
   *         description: Week details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/Week'
   *                 - $ref: '#/components/schemas/WeekFull'
   *             examples:
   *               basic:
   *                 summary: Basic week details
   *                 value:
   *                   id: 1
   *                   name: "Week 1"
   *                   seasonId: 1
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full week details with relations
   *                 value:
   *                   id: 1
   *                   name: "Week 1"
   *                   seasonId: 1
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *                   season: {}
   *                   matches: []
   *       400:
   *         description: Invalid week ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Week not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/week:
   *   post:
   *     tags:
   *       - Week
   *     summary: Create a new week
   *     description: Create a new week for a season
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/WeekInput'
   *           examples:
   *             regularWeek:
   *               summary: Create a regular season week
   *               value:
   *                 name: "Week 3"
   *                 seasonId: 1
   *             playoffWeek:
   *               summary: Create a playoff week
   *               value:
   *                 name: "Playoffs - Semifinals"
   *                 seasonId: 1
   *             specialWeek:
   *               summary: Create a special themed week
   *               value:
   *                 name: "All-Star Week"
   *                 seasonId: 2
   *     responses:
   *       201:
   *         description: Week created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Week'
   *             example:
   *               id: 4
   *               name: "Week 3"
   *               seasonId: 1
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
   *               error: "name: must be a string; seasonId: must be a number"
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
   * /api/week/{id}:
   *   put:
   *     tags:
   *       - Week
   *     summary: Update a week
   *     description: Update an existing week. All fields are optional for partial updates.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the week
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full week details in the response
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/WeekUpdateInput'
   *           examples:
   *             updateName:
   *               summary: Update only the week name
   *               value:
   *                 name: "Week 1 - Opening Battles"
   *             changeSeason:
   *               summary: Move week to different season
   *               value:
   *                 seasonId: 2
   *             updateMultiple:
   *               summary: Update multiple fields
   *               value:
   *                 name: "Week 1 - Revised"
   *                 seasonId: 2
   *     responses:
   *       200:
   *         description: Week updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/Week'
   *                 - $ref: '#/components/schemas/WeekFull'
   *             example:
   *               id: 1
   *               name: "Week 1 - Opening Battles"
   *               seasonId: 1
   *               isActive: true
   *               createdAt: "2024-01-01T00:00:00.000Z"
   *               updatedAt: "2024-01-20T15:00:00.000Z"
   *       400:
   *         description: Invalid week ID format or invalid input data
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
   *         description: Week not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/week/{id}:
   *   delete:
   *     tags:
   *       - Week
   *     summary: Delete a week
   *     description: |
   *       Permanently delete a week.
   *       This action cannot be undone.
   *       Note: Ensure no matches are scheduled for this week before deletion.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the week to delete
   *         example: 1
   *     responses:
   *       204:
   *         description: Week deleted successfully (no content returned)
   *       400:
   *         description: Invalid week ID format
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
   *         description: Week not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Week not found"
   *               statusCode: 404
   *               timestamp: "2024-01-20T16:00:00.000Z"
   */

  /**
   * @swagger
   * /api/league/{leagueId}/week:
   *   get:
   *     tags:
   *       - Week
   *     summary: Get all weeks
   *     description: Retrieve a list of all weeks with optional pagination, sorting, and full details
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
   *         description: Field name to sort by (e.g., name, createdAt, seasonId)
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
   *         description: Include full week details (season and matches)
   *     responses:
   *       200:
   *         description: List of weeks retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 oneOf:
   *                   - $ref: '#/components/schemas/Week'
   *                   - $ref: '#/components/schemas/WeekFull'
   *             examples:
   *               basic:
   *                 summary: Basic week list
   *                 value:
   *                   - id: 1
   *                     name: "Week 1"
   *                     seasonId: 1
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 2
   *                     name: "Week 2"
   *                     seasonId: 1
   *                     isActive: true
   *                     createdAt: "2024-01-08T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 3
   *                     name: "Playoffs - Round 1"
   *                     seasonId: 1
   *                     isActive: true
   *                     createdAt: "2024-01-15T00:00:00.000Z"
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
   * /api/league/{leagueId}/week/{id}:
   *   get:
   *     tags:
   *       - Week
   *     summary: Get a week by ID
   *     description: Retrieve detailed information about a specific week
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
   *         description: Unique identifier of the week
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full week details (season and matches)
   *     responses:
   *       200:
   *         description: Week details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/Week'
   *                 - $ref: '#/components/schemas/WeekFull'
   *             examples:
   *               basic:
   *                 summary: Basic week details
   *                 value:
   *                   id: 1
   *                   name: "Week 1"
   *                   seasonId: 1
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full week details with relations
   *                 value:
   *                   id: 1
   *                   name: "Week 1"
   *                   seasonId: 1
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *                   season: {}
   *                   matches: []
   *       400:
   *         description: Invalid week ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Week not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/league/{leagueId}/week:
   *   post:
   *     tags:
   *       - Week
   *     summary: Create a new week
   *     description: Create a new week for a season
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
   *             $ref: '#/components/schemas/WeekInput'
   *           examples:
   *             regularWeek:
   *               summary: Create a regular season week
   *               value:
   *                 name: "Week 3"
   *                 seasonId: 1
   *             playoffWeek:
   *               summary: Create a playoff week
   *               value:
   *                 name: "Playoffs - Semifinals"
   *                 seasonId: 1
   *             specialWeek:
   *               summary: Create a special themed week
   *               value:
   *                 name: "All-Star Week"
   *                 seasonId: 2
   *     responses:
   *       201:
   *         description: Week created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Week'
   *             example:
   *               id: 4
   *               name: "Week 3"
   *               seasonId: 1
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
   *               error: "name: must be a string; seasonId: must be a number"
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
   * /api/league/{leagueId}/week/{id}:
   *   put:
   *     tags:
   *       - Week
   *     summary: Update a week
   *     description: Update an existing week. All fields are optional for partial updates.
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
   *         description: Unique identifier of the week
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full week details in the response
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/WeekUpdateInput'
   *           examples:
   *             updateName:
   *               summary: Update only the week name
   *               value:
   *                 name: "Week 1 - Opening Battles"
   *             changeSeason:
   *               summary: Move week to different season
   *               value:
   *                 seasonId: 2
   *             updateMultiple:
   *               summary: Update multiple fields
   *               value:
   *                 name: "Week 1 - Revised"
   *                 seasonId: 2
   *     responses:
   *       200:
   *         description: Week updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/Week'
   *                 - $ref: '#/components/schemas/WeekFull'
   *             example:
   *               id: 1
   *               name: "Week 1 - Opening Battles"
   *               seasonId: 1
   *               isActive: true
   *               createdAt: "2024-01-01T00:00:00.000Z"
   *               updatedAt: "2024-01-20T15:00:00.000Z"
   *       400:
   *         description: Invalid week ID format or invalid input data
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
   *         description: Week not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/league/{leagueId}/week/{id}:
   *   delete:
   *     tags:
   *       - Week
   *     summary: Delete a week
   *     description: |
   *       Permanently delete a week.
   *       This action cannot be undone.
   *       Note: Ensure no matches are scheduled for this week before deletion.
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
   *         description: Unique identifier of the week to delete
   *         example: 1
   *     responses:
   *       204:
   *         description: Week deleted successfully (no content returned)
   *       400:
   *         description: Invalid week ID format
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
   *         description: Week not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Week not found"
   *               statusCode: 404
   *               timestamp: "2024-01-20T16:00:00.000Z"
   */
}
