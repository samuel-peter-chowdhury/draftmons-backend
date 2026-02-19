import { Request, Router } from 'express';
import { LeagueUserService } from '../services/league-user.service';
import { BaseController } from './base.controller';
import { LeagueUser } from '../entities/league-user.entity';
import { validateDto, validatePartialDto } from '../middleware/validation.middleware';
import { LeagueUserInputDto, LeagueUserOutputDto } from '../dtos/league-user.dto';
import { FindOptionsWhere, FindOptionsRelations } from 'typeorm';
import { plainToInstance } from 'class-transformer';

export class LeagueUserController extends BaseController<
  LeagueUser,
  LeagueUserInputDto,
  LeagueUserOutputDto
> {
  public router = Router();

  constructor(private leagueUserService: LeagueUserService) {
    super(leagueUserService, LeagueUserOutputDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', this.getAll);
    this.router.get('/:id', this.getById);
    this.router.post('/', validateDto(LeagueUserInputDto), this.create);
    this.router.put('/:id', validatePartialDto(LeagueUserInputDto), this.update);
    this.router.delete('/:id', this.delete);
  }

  protected getFullTransformGroup(): string[] {
    return ['leagueUser.full'];
  }

  protected getAllowedSortFields(): string[] {
    return ['id', 'createdAt', 'updatedAt'];
  }

  protected async getWhere(
    req: Request,
  ): Promise<FindOptionsWhere<LeagueUser> | FindOptionsWhere<LeagueUser>[] | undefined> {
    return plainToInstance(LeagueUserInputDto, req.query, { excludeExtraneousValues: true });
  }

  protected getBaseRelations(): FindOptionsRelations<LeagueUser> | undefined {
    return undefined;
  }

  protected getFullRelations(): FindOptionsRelations<LeagueUser> | undefined {
    return { league: true, user: true };
  }

  /**
   * @swagger
   * tags:
   *   name: LeagueUser
   *   description: League user membership management and operations
   *
   * components:
   *   schemas:
   *     LeagueUser:
   *       type: object
   *       required:
   *         - id
   *         - leagueId
   *         - userId
   *         - isModerator
   *         - isActive
   *         - createdAt
   *         - updatedAt
   *       properties:
   *         id:
   *           type: integer
   *           description: Unique identifier of the league user relationship
   *           example: 1
   *         leagueId:
   *           type: integer
   *           description: ID of the league
   *           example: 5
   *         userId:
   *           type: integer
   *           description: ID of the user
   *           example: 10
   *         isModerator:
   *           type: boolean
   *           description: Whether the user is a moderator of this league
   *           example: false
   *           default: false
   *         isActive:
   *           type: boolean
   *           description: Whether the league user relationship is currently active
   *           example: true
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the user joined the league
   *           example: "2024-01-01T00:00:00.000Z"
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the league user was last updated
   *           example: "2024-01-15T12:30:00.000Z"
   *
   *     LeagueUserFull:
   *       allOf:
   *         - $ref: '#/components/schemas/LeagueUser'
   *         - type: object
   *           properties:
   *             league:
   *               $ref: '#/components/schemas/League'
   *               description: Full league details
   *             user:
   *               $ref: '#/components/schemas/User'
   *               description: Full user details
   *
   *     LeagueUserInput:
   *       type: object
   *       required:
   *         - leagueId
   *         - userId
   *         - isModerator
   *       properties:
   *         leagueId:
   *           type: integer
   *           description: ID of the league
   *           example: 5
   *           minimum: 1
   *         userId:
   *           type: integer
   *           description: ID of the user
   *           example: 10
   *           minimum: 1
   *         isModerator:
   *           type: boolean
   *           description: Whether the user should be a moderator of this league
   *           example: false
   *           default: false
   *
   *     LeagueUserUpdateInput:
   *       type: object
   *       properties:
   *         leagueId:
   *           type: integer
   *           description: ID of the league
   *           example: 5
   *           minimum: 1
   *         userId:
   *           type: integer
   *           description: ID of the user
   *           example: 10
   *           minimum: 1
   *         isModerator:
   *           type: boolean
   *           description: Whether the user should be a moderator of this league
   *           example: true
   */

  /**
   * @swagger
   * /api/league-user:
   *   get:
   *     tags:
   *       - LeagueUser
   *     summary: Get all league users
   *     description: Retrieve a list of all league user memberships with optional pagination, sorting, and full details
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
   *         description: Field name to sort by (e.g., createdAt, leagueId, userId)
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
   *         description: Include full league user details (league and user information)
   *     responses:
   *       200:
   *         description: List of league users retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 oneOf:
   *                   - $ref: '#/components/schemas/LeagueUser'
   *                   - $ref: '#/components/schemas/LeagueUserFull'
   *             examples:
   *               basic:
   *                 summary: Basic league user list
   *                 value:
   *                   - id: 1
   *                     leagueId: 5
   *                     userId: 10
   *                     isModerator: true
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 2
   *                     leagueId: 5
   *                     userId: 11
   *                     isModerator: false
   *                     isActive: true
   *                     createdAt: "2024-01-02T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full league user details
   *                 value:
   *                   - id: 1
   *                     leagueId: 5
   *                     userId: 10
   *                     isModerator: true
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                     league: {}
   *                     user: {}
   *       400:
   *         description: Invalid query parameters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/league-user/{id}:
   *   get:
   *     tags:
   *       - LeagueUser
   *     summary: Get a league user by ID
   *     description: Retrieve detailed information about a specific league user membership
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the league user
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full league user details (league and user information)
   *     responses:
   *       200:
   *         description: League user details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/LeagueUser'
   *                 - $ref: '#/components/schemas/LeagueUserFull'
   *             examples:
   *               basic:
   *                 summary: Basic league user details
   *                 value:
   *                   id: 1
   *                   leagueId: 5
   *                   userId: 10
   *                   isModerator: true
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full league user details with relations
   *                 value:
   *                   id: 1
   *                   leagueId: 5
   *                   userId: 10
   *                   isModerator: true
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *                   league: {}
   *                   user: {}
   *       400:
   *         description: Invalid league user ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: League user not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/league-user:
   *   post:
   *     tags:
   *       - LeagueUser
   *     summary: Add a user to a league
   *     description: Create a new league user membership to add a user to a league
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LeagueUserInput'
   *           examples:
   *             regularMember:
   *               summary: Add regular member to league
   *               value:
   *                 leagueId: 5
   *                 userId: 15
   *                 isModerator: false
   *             moderator:
   *               summary: Add moderator to league
   *               value:
   *                 leagueId: 5
   *                 userId: 20
   *                 isModerator: true
   *     responses:
   *       201:
   *         description: League user created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LeagueUser'
   *             example:
   *               id: 3
   *               leagueId: 5
   *               userId: 15
   *               isModerator: false
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
   *               error: "leagueId: must be a number; userId: must be a number"
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
   * /api/league-user/{id}:
   *   put:
   *     tags:
   *       - LeagueUser
   *     summary: Update a league user
   *     description: Update an existing league user membership. All fields are optional for partial updates.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the league user
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full league user details in the response (league and user information)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LeagueUserUpdateInput'
   *           examples:
   *             promoteModerator:
   *               summary: Promote user to moderator
   *               value:
   *                 isModerator: true
   *             demoteModerator:
   *               summary: Remove moderator privileges
   *               value:
   *                 isModerator: false
   *             changeLeague:
   *               summary: Move user to different league
   *               value:
   *                 leagueId: 8
   *     responses:
   *       200:
   *         description: League user updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/LeagueUser'
   *                 - $ref: '#/components/schemas/LeagueUserFull'
   *             example:
   *               id: 1
   *               leagueId: 5
   *               userId: 10
   *               isModerator: true
   *               isActive: true
   *               createdAt: "2024-01-01T00:00:00.000Z"
   *               updatedAt: "2024-01-20T15:00:00.000Z"
   *       400:
   *         description: Invalid league user ID format or invalid input data
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
   *         description: League user not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/league-user/{id}:
   *   delete:
   *     tags:
   *       - LeagueUser
   *     summary: Remove a user from a league
   *     description: |
   *       Permanently remove a user from a league.
   *       This action cannot be undone.
   *       The user will lose all league-specific data and permissions.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the league user to delete
   *         example: 1
   *     responses:
   *       204:
   *         description: League user deleted successfully (no content returned)
   *       400:
   *         description: Invalid league user ID format
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
   *         description: League user not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "League user not found"
   *               statusCode: 404
   *               timestamp: "2024-01-20T16:00:00.000Z"
   */

  /**
   * @swagger
   * /api/league/{leagueId}/league-user:
   *   get:
   *     tags:
   *       - LeagueUser
   *     summary: Get all league users
   *     description: Retrieve a list of all league user memberships with optional pagination, sorting, and full details
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
   *         description: Field name to sort by (e.g., createdAt, leagueId, userId)
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
   *         description: Include full league user details (league and user information)
   *     responses:
   *       200:
   *         description: List of league users retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 oneOf:
   *                   - $ref: '#/components/schemas/LeagueUser'
   *                   - $ref: '#/components/schemas/LeagueUserFull'
   *             examples:
   *               basic:
   *                 summary: Basic league user list
   *                 value:
   *                   - id: 1
   *                     leagueId: 5
   *                     userId: 10
   *                     isModerator: true
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 2
   *                     leagueId: 5
   *                     userId: 11
   *                     isModerator: false
   *                     isActive: true
   *                     createdAt: "2024-01-02T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full league user details
   *                 value:
   *                   - id: 1
   *                     leagueId: 5
   *                     userId: 10
   *                     isModerator: true
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                     league: {}
   *                     user: {}
   *       400:
   *         description: Invalid query parameters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/league/{leagueId}/league-user/{id}:
   *   get:
   *     tags:
   *       - LeagueUser
   *     summary: Get a league user by ID
   *     description: Retrieve detailed information about a specific league user membership
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
   *         description: Unique identifier of the league user
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full league user details (league and user information)
   *     responses:
   *       200:
   *         description: League user details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/LeagueUser'
   *                 - $ref: '#/components/schemas/LeagueUserFull'
   *             examples:
   *               basic:
   *                 summary: Basic league user details
   *                 value:
   *                   id: 1
   *                   leagueId: 5
   *                   userId: 10
   *                   isModerator: true
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full league user details with relations
   *                 value:
   *                   id: 1
   *                   leagueId: 5
   *                   userId: 10
   *                   isModerator: true
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *                   league: {}
   *                   user: {}
   *       400:
   *         description: Invalid league user ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: League user not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/league/{leagueId}/league-user:
   *   post:
   *     tags:
   *       - LeagueUser
   *     summary: Add a user to a league
   *     description: Create a new league user membership to add a user to a league
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
   *             $ref: '#/components/schemas/LeagueUserInput'
   *           examples:
   *             regularMember:
   *               summary: Add regular member to league
   *               value:
   *                 leagueId: 5
   *                 userId: 15
   *                 isModerator: false
   *             moderator:
   *               summary: Add moderator to league
   *               value:
   *                 leagueId: 5
   *                 userId: 20
   *                 isModerator: true
   *     responses:
   *       201:
   *         description: League user created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LeagueUser'
   *             example:
   *               id: 3
   *               leagueId: 5
   *               userId: 15
   *               isModerator: false
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
   *               error: "leagueId: must be a number; userId: must be a number"
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
   * /api/league/{leagueId}/league-user/{id}:
   *   put:
   *     tags:
   *       - LeagueUser
   *     summary: Update a league user
   *     description: Update an existing league user membership. All fields are optional for partial updates.
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
   *         description: Unique identifier of the league user
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full league user details in the response (league and user information)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LeagueUserUpdateInput'
   *           examples:
   *             promoteModerator:
   *               summary: Promote user to moderator
   *               value:
   *                 isModerator: true
   *             demoteModerator:
   *               summary: Remove moderator privileges
   *               value:
   *                 isModerator: false
   *             changeLeague:
   *               summary: Move user to different league
   *               value:
   *                 leagueId: 8
   *     responses:
   *       200:
   *         description: League user updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/LeagueUser'
   *                 - $ref: '#/components/schemas/LeagueUserFull'
   *             example:
   *               id: 1
   *               leagueId: 5
   *               userId: 10
   *               isModerator: true
   *               isActive: true
   *               createdAt: "2024-01-01T00:00:00.000Z"
   *               updatedAt: "2024-01-20T15:00:00.000Z"
   *       400:
   *         description: Invalid league user ID format or invalid input data
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
   *         description: League user not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/league/{leagueId}/league-user/{id}:
   *   delete:
   *     tags:
   *       - LeagueUser
   *     summary: Remove a user from a league
   *     description: |
   *       Permanently remove a user from a league.
   *       This action cannot be undone.
   *       The user will lose all league-specific data and permissions.
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
   *         description: Unique identifier of the league user to delete
   *         example: 1
   *     responses:
   *       204:
   *         description: League user deleted successfully (no content returned)
   *       400:
   *         description: Invalid league user ID format
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
   *         description: League user not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "League user not found"
   *               statusCode: 404
   *               timestamp: "2024-01-20T16:00:00.000Z"
   */
}
