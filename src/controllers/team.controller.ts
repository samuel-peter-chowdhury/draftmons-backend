import { Request, Router } from 'express';
import { TeamService } from '../services/team.service';
import { BaseController } from './base.controller';
import { Team } from '../entities/team.entity';
import { validateDto, validatePartialDto } from '../middleware/validation.middleware';
import { isAdmin } from '../middleware/auth.middleware';
import { TeamInputDto, TeamOutputDto } from '../dtos/team.dto';
import { FindOptionsWhere, FindOptionsRelations } from 'typeorm';
import { plainToInstance } from 'class-transformer';

export class TeamController extends BaseController<Team, TeamInputDto, TeamOutputDto> {
  public router = Router();

  constructor(private teamService: TeamService) {
    super(teamService, TeamOutputDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Public team routes
    this.router.get('/', this.getAll);
    this.router.get('/:id', this.getById);

    // Authenticated routes
    this.router.post('/', isAdmin, validateDto(TeamInputDto), this.create);
    this.router.put('/:id', isAdmin, validatePartialDto(TeamInputDto), this.update);
    this.router.delete('/:id', isAdmin, this.delete);
  }

  protected getFullTransformGroup(): string[] {
    return ['team.full'];
  }

  protected async getWhere(req: Request): Promise<FindOptionsWhere<Team> | undefined> {
    return plainToInstance(TeamInputDto, req.query, { excludeExtraneousValues: true });
  }

  protected getBaseRelations(): FindOptionsRelations<Team> | undefined {
    return undefined;
  }

  protected getFullRelations(): FindOptionsRelations<Team> | undefined {
    return undefined;
  }

  /**
   * @swagger
   * tags:
   *   name: Team
   *   description: Team management and operations
   * 
   * components:
   *   schemas:
   *     Team:
   *       type: object
   *       required:
   *         - id
   *         - name
   *         - seasonId
   *         - userId
   *         - isActive
   *         - createdAt
   *         - updatedAt
   *       properties:
   *         id:
   *           type: integer
   *           description: Unique identifier of the team
   *           example: 1
   *         name:
   *           type: string
   *           description: Name of the team
   *           example: "Thunder Bolts"
   *         seasonId:
   *           type: integer
   *           description: ID of the associated season
   *           example: 1
   *         userId:
   *           type: integer
   *           description: ID of the team owner
   *           example: 5
   *         isActive:
   *           type: boolean
   *           description: Whether the team is currently active
   *           example: true
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the team was created
   *           example: "2024-01-01T00:00:00.000Z"
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the team was last updated
   *           example: "2024-01-15T12:30:00.000Z"
   *     
   *     TeamFull:
   *       allOf:
   *         - $ref: '#/components/schemas/Team'
   *         - type: object
   *           properties:
   *             season:
   *               $ref: '#/components/schemas/Season'
   *               description: Full season details
   *             user:
   *               $ref: '#/components/schemas/User'
   *               description: Full user details
   *             seasonPokemon:
   *               type: array
   *               description: List of Pokemon on this team
   *               items:
   *                 $ref: '#/components/schemas/SeasonPokemon'
   *             matchTeams:
   *               type: array
   *               description: List of match participations
   *               items:
   *                 $ref: '#/components/schemas/MatchTeam'
   *             wonGames:
   *               type: array
   *               description: List of games won by this team
   *               items:
   *                 $ref: '#/components/schemas/Game'
   *     
   *     TeamInput:
   *       type: object
   *       required:
   *         - name
   *         - seasonId
   *         - userId
   *       properties:
   *         name:
   *           type: string
   *           description: Name of the team
   *           example: "Thunder Bolts"
   *           minLength: 1
   *           maxLength: 100
   *         seasonId:
   *           type: integer
   *           description: ID of the associated season
   *           example: 1
   *           minimum: 1
   *         userId:
   *           type: integer
   *           description: ID of the team owner
   *           example: 5
   *           minimum: 1
   *     
   *     TeamUpdateInput:
   *       type: object
   *       properties:
   *         name:
   *           type: string
   *           description: Name of the team
   *           example: "Thunder Bolts"
   *           minLength: 1
   *           maxLength: 100
   *         seasonId:
   *           type: integer
   *           description: ID of the associated season
   *           example: 1
   *           minimum: 1
   *         userId:
   *           type: integer
   *           description: ID of the team owner
   *           example: 5
   *           minimum: 1
   */

  /**
   * @swagger
   * /api/team:
   *   get:
   *     tags:
   *       - Team
   *     summary: Get all teams
   *     description: Retrieve a list of all teams with optional pagination, sorting, and full details
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
   *         description: Include full team details (season, user, seasonPokemon, matchTeams, wonGames)
   *     responses:
   *       200:
   *         description: List of teams retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 oneOf:
   *                   - $ref: '#/components/schemas/Team'
   *                   - $ref: '#/components/schemas/TeamFull'
   *             examples:
   *               basic:
   *                 summary: Basic team list
   *                 value:
   *                   - id: 1
   *                     name: "Thunder Bolts"
   *                     seasonId: 1
   *                     userId: 5
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 2
   *                     name: "Fire Blazers"
   *                     seasonId: 1
   *                     userId: 6
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
   * /api/team/{id}:
   *   get:
   *     tags:
   *       - Team
   *     summary: Get a team by ID
   *     description: Retrieve detailed information about a specific team
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the team
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full team details (season, user, seasonPokemon, matchTeams, wonGames)
   *     responses:
   *       200:
   *         description: Team details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/Team'
   *                 - $ref: '#/components/schemas/TeamFull'
   *             examples:
   *               basic:
   *                 summary: Basic team details
   *                 value:
   *                   id: 1
   *                   name: "Thunder Bolts"
   *                   seasonId: 1
   *                   userId: 5
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *       400:
   *         description: Invalid team ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Team not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/team:
   *   post:
   *     tags:
   *       - Team
   *     summary: Create a new team
   *     description: Create a new team for a season
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TeamInput'
   *           examples:
   *             standard:
   *               summary: Create a standard team
   *               value:
   *                 name: "Aqua Warriors"
   *                 seasonId: 1
   *                 userId: 7
   *             creative:
   *               summary: Create a team with creative name
   *               value:
   *                 name: "Psychic Phenomena"
   *                 seasonId: 2
   *                 userId: 8
   *     responses:
   *       201:
   *         description: Team created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Team'
   *             example:
   *               id: 3
   *               name: "Aqua Warriors"
   *               seasonId: 1
   *               userId: 7
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
   * /api/team/{id}:
   *   put:
   *     tags:
   *       - Team
   *     summary: Update a team
   *     description: Update an existing team. All fields are optional for partial updates.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the team
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full team details in the response
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TeamUpdateInput'
   *           examples:
   *             updateName:
   *               summary: Update only the team name
   *               value:
   *                 name: "Thunder Storm"
   *             transferOwnership:
   *               summary: Transfer team ownership
   *               value:
   *                 userId: 10
   *             updateMultiple:
   *               summary: Update multiple fields
   *               value:
   *                 name: "Thunder Storm"
   *                 userId: 10
   *     responses:
   *       200:
   *         description: Team updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/Team'
   *                 - $ref: '#/components/schemas/TeamFull'
   *             example:
   *               id: 1
   *               name: "Thunder Storm"
   *               seasonId: 1
   *               userId: 10
   *               isActive: true
   *               createdAt: "2024-01-01T00:00:00.000Z"
   *               updatedAt: "2024-01-20T15:00:00.000Z"
   *       400:
   *         description: Invalid team ID format or invalid input data
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
   *         description: Team not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/team/{id}:
   *   delete:
   *     tags:
   *       - Team
   *     summary: Delete a team
   *     description: |
   *       Permanently delete a team.
   *       This action cannot be undone.
   *       Note: Ensure no matches or games are associated with this team before deletion.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the team to delete
   *         example: 1
   *     responses:
   *       204:
   *         description: Team deleted successfully (no content returned)
   *       400:
   *         description: Invalid team ID format
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
   *         description: Team not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Team not found"
   *               statusCode: 404
   *               timestamp: "2024-01-20T16:00:00.000Z"
   */
}