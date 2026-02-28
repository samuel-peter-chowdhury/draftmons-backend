import { Request, Router } from 'express';
import { TeamBuildService } from '../services/team-build.service';
import { BaseController } from './base.controller';
import { TeamBuild } from '../entities/team-build.entity';
import { validateDto, validatePartialDto } from '../middleware/validation.middleware';
import { TeamBuildInputDto, TeamBuildOutputDto } from '../dtos/team-build.dto';
import { FindOptionsWhere, FindOptionsRelations } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { isAuthenticated } from '../middleware/auth.middleware';

export class TeamBuildController extends BaseController<
  TeamBuild,
  TeamBuildInputDto,
  TeamBuildOutputDto
> {
  public router = Router();

  constructor(private teamBuildService: TeamBuildService) {
    super(teamBuildService, TeamBuildOutputDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', this.getAll);
    this.router.get('/:id', this.getById);
    this.router.post('/', isAuthenticated, validateDto(TeamBuildInputDto), this.create);
    this.router.put('/:id', isAuthenticated, validatePartialDto(TeamBuildInputDto), this.update);
    this.router.delete('/:id', isAuthenticated, this.delete);
  }

  protected getFullTransformGroup(): string[] {
    return ['teamBuild.full'];
  }

  protected getAllowedSortFields(): string[] {
    return ['id', 'name', 'userId', 'seasonId', 'generationId', 'createdAt', 'updatedAt'];
  }

  protected async getWhere(
    req: Request,
  ): Promise<FindOptionsWhere<TeamBuild> | FindOptionsWhere<TeamBuild>[] | undefined> {
    return plainToInstance(TeamBuildInputDto, req.query, { excludeExtraneousValues: true });
  }

  protected getBaseRelations(): FindOptionsRelations<TeamBuild> | undefined {
    return {
      generation: true,
    };
  }

  protected getFullRelations(): FindOptionsRelations<TeamBuild> | undefined {
    return {
      user: true,
      season: true,
      generation: true,
      teamBuildSets: {
        pokemon: {
          pokemonTypes: true,
          abilities: true,
        },
        item: true,
        ability: true,
        move1: true,
        move2: true,
        move3: true,
        move4: true,
        nature: true,
      },
    };
  }

  /**
   * @swagger
   * tags:
   *   name: TeamBuild
   *   description: Team build management and operations
   *
   * components:
   *   schemas:
   *     TeamBuild:
   *       type: object
   *       required:
   *         - id
   *         - name
   *         - userId
   *         - generationId
   *         - isActive
   *         - createdAt
   *         - updatedAt
   *       properties:
   *         id:
   *           type: integer
   *           description: Unique identifier of the team build
   *           example: 1
   *         name:
   *           type: string
   *           description: Name of the team build
   *           example: "Rain Team Gen 9"
   *         userId:
   *           type: integer
   *           description: ID of the user who owns this team build
   *           example: 1
   *         seasonId:
   *           type: integer
   *           nullable: true
   *           description: ID of the associated season (optional)
   *           example: 3
   *         generationId:
   *           type: integer
   *           description: ID of the generation this team build is for
   *           example: 1
   *         isActive:
   *           type: boolean
   *           description: Whether the team build is currently active
   *           example: true
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the team build was created
   *           example: "2024-01-01T00:00:00.000Z"
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the team build was last updated
   *           example: "2024-01-15T12:30:00.000Z"
   *
   *     TeamBuildFull:
   *       allOf:
   *         - $ref: '#/components/schemas/TeamBuild'
   *         - type: object
   *           properties:
   *             user:
   *               $ref: '#/components/schemas/User'
   *               description: Full user details
   *             season:
   *               $ref: '#/components/schemas/Season'
   *               description: Full season details (if associated)
   *             generation:
   *               $ref: '#/components/schemas/Generation'
   *               description: Full generation details
   *             teamBuildSets:
   *               type: array
   *               description: List of Pokemon sets in this team build
   *               items:
   *                 $ref: '#/components/schemas/TeamBuildSet'
   *
   *     TeamBuildInput:
   *       type: object
   *       required:
   *         - name
   *         - userId
   *         - generationId
   *       properties:
   *         name:
   *           type: string
   *           description: Name of the team build
   *           example: "Rain Team Gen 9"
   *         userId:
   *           type: integer
   *           description: ID of the user who owns this team build
   *           example: 1
   *           minimum: 1
   *         seasonId:
   *           type: integer
   *           nullable: true
   *           description: ID of the associated season (must match generationId if provided)
   *           example: 3
   *           minimum: 1
   *         generationId:
   *           type: integer
   *           description: ID of the generation this team build is for
   *           example: 1
   *           minimum: 1
   *
   *     TeamBuildUpdateInput:
   *       type: object
   *       properties:
   *         name:
   *           type: string
   *           description: Name of the team build
   *           example: "Updated Rain Team"
   *         userId:
   *           type: integer
   *           description: ID of the user who owns this team build
   *           example: 1
   *           minimum: 1
   *         seasonId:
   *           type: integer
   *           nullable: true
   *           description: ID of the associated season (must match generationId if provided)
   *           example: 3
   *           minimum: 1
   *         generationId:
   *           type: integer
   *           description: ID of the generation this team build is for
   *           example: 1
   *           minimum: 1
   */

  /**
   * @swagger
   * /api/team-build:
   *   get:
   *     tags:
   *       - TeamBuild
   *     summary: Get all team builds
   *     description: Retrieve a list of all team builds with optional pagination, sorting, and full details
   *     security:
   *       - sessionAuth: []
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
   *         description: Include full team build details (user, season, generation, sets with Pokemon)
   *     responses:
   *       200:
   *         description: List of team builds retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 oneOf:
   *                   - $ref: '#/components/schemas/TeamBuild'
   *                   - $ref: '#/components/schemas/TeamBuildFull'
   *             examples:
   *               basic:
   *                 summary: Basic team build list
   *                 value:
   *                   - id: 1
   *                     name: "Rain Team Gen 9"
   *                     userId: 1
   *                     seasonId: 3
   *                     generationId: 1
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 2
   *                     name: "Sun Team Gen 9"
   *                     userId: 1
   *                     seasonId: null
   *                     generationId: 1
   *                     isActive: true
   *                     createdAt: "2024-01-02T00:00:00.000Z"
   *                     updatedAt: "2024-01-16T12:30:00.000Z"
   *       400:
   *         description: Invalid query parameters
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
   *               timestamp: "2024-01-20T10:00:00.000Z"
   */

  /**
   * @swagger
   * /api/team-build/{id}:
   *   get:
   *     tags:
   *       - TeamBuild
   *     summary: Get a team build by ID
   *     description: Retrieve detailed information about a specific team build
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the team build
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full team build details (user, season, generation, sets with Pokemon)
   *     responses:
   *       200:
   *         description: Team build details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/TeamBuild'
   *                 - $ref: '#/components/schemas/TeamBuildFull'
   *             examples:
   *               basic:
   *                 summary: Basic team build details
   *                 value:
   *                   id: 1
   *                   name: "Rain Team Gen 9"
   *                   userId: 1
   *                   seasonId: 3
   *                   generationId: 1
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *       400:
   *         description: Invalid team build ID format
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
   *       404:
   *         description: Team build not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/team-build:
   *   post:
   *     tags:
   *       - TeamBuild
   *     summary: Create a new team build
   *     description: |
   *       Create a new team build for a user. If seasonId is provided, the season's
   *       generationId must match the provided generationId.
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TeamBuildInput'
   *           examples:
   *             withSeason:
   *               summary: Create team build tied to a season
   *               value:
   *                 name: "Rain Team Gen 9"
   *                 userId: 1
   *                 seasonId: 3
   *                 generationId: 1
   *             withoutSeason:
   *               summary: Create team build without a season
   *               value:
   *                 name: "Sun Team Gen 9"
   *                 userId: 1
   *                 generationId: 1
   *     responses:
   *       201:
   *         description: Team build created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/TeamBuild'
   *             example:
   *               id: 3
   *               name: "Rain Team Gen 9"
   *               userId: 1
   *               seasonId: 3
   *               generationId: 1
   *               isActive: true
   *               createdAt: "2024-01-20T10:00:00.000Z"
   *               updatedAt: "2024-01-20T10:00:00.000Z"
   *       400:
   *         description: Invalid input data or season generation mismatch
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Season generation (2) does not match team build generation (1)"
   *               statusCode: 400
   *               timestamp: "2024-01-20T10:00:00.000Z"
   *       401:
   *         description: User not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/team-build/{id}:
   *   put:
   *     tags:
   *       - TeamBuild
   *     summary: Update a team build
   *     description: |
   *       Update an existing team build. All fields are optional for partial updates.
   *       If seasonId is provided, the season's generationId must match the team build's generationId.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the team build
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full team build details in the response
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TeamBuildUpdateInput'
   *           examples:
   *             updateName:
   *               summary: Update only the name
   *               value:
   *                 name: "Updated Rain Team"
   *             updateSeason:
   *               summary: Associate with a season
   *               value:
   *                 seasonId: 5
   *             updateMultiple:
   *               summary: Update multiple fields
   *               value:
   *                 name: "Updated Rain Team"
   *                 seasonId: 5
   *     responses:
   *       200:
   *         description: Team build updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/TeamBuild'
   *                 - $ref: '#/components/schemas/TeamBuildFull'
   *             example:
   *               id: 1
   *               name: "Updated Rain Team"
   *               userId: 1
   *               seasonId: 5
   *               generationId: 1
   *               isActive: true
   *               createdAt: "2024-01-01T00:00:00.000Z"
   *               updatedAt: "2024-01-20T15:00:00.000Z"
   *       400:
   *         description: Invalid input data or season generation mismatch
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
   *       404:
   *         description: Team build not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/team-build/{id}:
   *   delete:
   *     tags:
   *       - TeamBuild
   *     summary: Delete a team build
   *     description: |
   *       Permanently delete a team build and all its associated sets.
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
   *         description: Unique identifier of the team build to delete
   *         example: 1
   *     responses:
   *       204:
   *         description: Team build deleted successfully (no content returned)
   *       400:
   *         description: Invalid team build ID format
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
   *         description: Team build not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "TeamBuild not found"
   *               statusCode: 404
   *               timestamp: "2024-01-20T16:00:00.000Z"
   */
}
