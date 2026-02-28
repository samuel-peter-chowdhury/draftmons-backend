import { Request, Router } from 'express';
import { TeamBuildSetService } from '../services/team-build-set.service';
import { BaseController } from './base.controller';
import { TeamBuildSet } from '../entities/team-build-set.entity';
import { validateDto, validatePartialDto } from '../middleware/validation.middleware';
import { TeamBuildSetInputDto, TeamBuildSetOutputDto } from '../dtos/team-build-set.dto';
import { FindOptionsWhere, FindOptionsRelations } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { isAuthenticated } from '../middleware/auth.middleware';

export class TeamBuildSetController extends BaseController<
  TeamBuildSet,
  TeamBuildSetInputDto,
  TeamBuildSetOutputDto
> {
  public router = Router();

  constructor(private teamBuildSetService: TeamBuildSetService) {
    super(teamBuildSetService, TeamBuildSetOutputDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', this.getAll);
    this.router.get('/:id', this.getById);
    this.router.post('/', isAuthenticated, validateDto(TeamBuildSetInputDto), this.create);
    this.router.put(
      '/:id',
      isAuthenticated,
      validatePartialDto(TeamBuildSetInputDto),
      this.update,
    );
    this.router.delete('/:id', isAuthenticated, this.delete);
  }

  protected getFullTransformGroup(): string[] {
    return ['teamBuildSet.full'];
  }

  protected getAllowedSortFields(): string[] {
    return ['id', 'teamBuildId', 'pokemonId', 'pointValue', 'createdAt', 'updatedAt'];
  }

  protected async getWhere(
    req: Request,
  ): Promise<FindOptionsWhere<TeamBuildSet> | FindOptionsWhere<TeamBuildSet>[] | undefined> {
    return plainToInstance(TeamBuildSetInputDto, req.query, { excludeExtraneousValues: true });
  }

  protected getBaseRelations(): FindOptionsRelations<TeamBuildSet> | undefined {
    return {
      pokemon: {
        pokemonTypes: true,
        abilities: true,
      },
    };
  }

  protected getFullRelations(): FindOptionsRelations<TeamBuildSet> | undefined {
    return {
      teamBuild: {
        generation: true,
      },
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
    };
  }

  /**
   * @swagger
   * tags:
   *   name: TeamBuildSet
   *   description: Team build set (individual Pokemon build) management and operations
   *
   * components:
   *   schemas:
   *     TeamBuildSet:
   *       type: object
   *       required:
   *         - id
   *         - teamBuildId
   *         - pokemonId
   *         - hpEv
   *         - attackEv
   *         - defenseEv
   *         - specialAttackEv
   *         - specialDefenseEv
   *         - speedEv
   *         - hpIv
   *         - attackIv
   *         - defenseIv
   *         - specialAttackIv
   *         - specialDefenseIv
   *         - speedIv
   *         - isActive
   *         - createdAt
   *         - updatedAt
   *       properties:
   *         id:
   *           type: integer
   *           description: Unique identifier of the team build set
   *           example: 1
   *         teamBuildId:
   *           type: integer
   *           description: ID of the parent team build
   *           example: 1
   *         pokemonId:
   *           type: integer
   *           description: ID of the Pokemon in this set
   *           example: 25
   *         pointValue:
   *           type: integer
   *           nullable: true
   *           description: Point value of this Pokemon
   *           example: 10
   *         condition:
   *           type: string
   *           nullable: true
   *           description: Special condition or note about this set
   *           example: "Tera Fire"
   *         itemId:
   *           type: integer
   *           nullable: true
   *           description: ID of the held item
   *           example: 5
   *         abilityId:
   *           type: integer
   *           nullable: true
   *           description: ID of the ability
   *           example: 12
   *         move1Id:
   *           type: integer
   *           nullable: true
   *           description: ID of the first move
   *           example: 100
   *         move2Id:
   *           type: integer
   *           nullable: true
   *           description: ID of the second move
   *           example: 200
   *         move3Id:
   *           type: integer
   *           nullable: true
   *           description: ID of the third move
   *           example: 300
   *         move4Id:
   *           type: integer
   *           nullable: true
   *           description: ID of the fourth move
   *           example: 400
   *         hpEv:
   *           type: integer
   *           description: HP effort value (0-252)
   *           example: 252
   *           minimum: 0
   *           maximum: 252
   *         attackEv:
   *           type: integer
   *           description: Attack effort value (0-252)
   *           example: 0
   *           minimum: 0
   *           maximum: 252
   *         defenseEv:
   *           type: integer
   *           description: Defense effort value (0-252)
   *           example: 4
   *           minimum: 0
   *           maximum: 252
   *         specialAttackEv:
   *           type: integer
   *           description: Special Attack effort value (0-252)
   *           example: 252
   *           minimum: 0
   *           maximum: 252
   *         specialDefenseEv:
   *           type: integer
   *           description: Special Defense effort value (0-252)
   *           example: 0
   *           minimum: 0
   *           maximum: 252
   *         speedEv:
   *           type: integer
   *           description: Speed effort value (0-252)
   *           example: 0
   *           minimum: 0
   *           maximum: 252
   *         hpIv:
   *           type: integer
   *           description: HP individual value (0-31)
   *           example: 31
   *           minimum: 0
   *           maximum: 31
   *         attackIv:
   *           type: integer
   *           description: Attack individual value (0-31)
   *           example: 0
   *           minimum: 0
   *           maximum: 31
   *         defenseIv:
   *           type: integer
   *           description: Defense individual value (0-31)
   *           example: 31
   *           minimum: 0
   *           maximum: 31
   *         specialAttackIv:
   *           type: integer
   *           description: Special Attack individual value (0-31)
   *           example: 31
   *           minimum: 0
   *           maximum: 31
   *         specialDefenseIv:
   *           type: integer
   *           description: Special Defense individual value (0-31)
   *           example: 31
   *           minimum: 0
   *           maximum: 31
   *         speedIv:
   *           type: integer
   *           description: Speed individual value (0-31)
   *           example: 31
   *           minimum: 0
   *           maximum: 31
   *         natureId:
   *           type: integer
   *           nullable: true
   *           description: ID of the nature
   *           example: 3
   *         isActive:
   *           type: boolean
   *           description: Whether the team build set is currently active
   *           example: true
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the team build set was created
   *           example: "2024-01-01T00:00:00.000Z"
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the team build set was last updated
   *           example: "2024-01-15T12:30:00.000Z"
   *
   *     TeamBuildSetFull:
   *       allOf:
   *         - $ref: '#/components/schemas/TeamBuildSet'
   *         - type: object
   *           properties:
   *             teamBuild:
   *               $ref: '#/components/schemas/TeamBuild'
   *               description: Full team build details
   *             pokemon:
   *               $ref: '#/components/schemas/Pokemon'
   *               description: Full Pokemon details
   *             item:
   *               $ref: '#/components/schemas/Item'
   *               description: Full held item details
   *             ability:
   *               $ref: '#/components/schemas/Ability'
   *               description: Full ability details
   *             move1:
   *               $ref: '#/components/schemas/Move'
   *               description: Full first move details
   *             move2:
   *               $ref: '#/components/schemas/Move'
   *               description: Full second move details
   *             move3:
   *               $ref: '#/components/schemas/Move'
   *               description: Full third move details
   *             move4:
   *               $ref: '#/components/schemas/Move'
   *               description: Full fourth move details
   *             nature:
   *               $ref: '#/components/schemas/Nature'
   *               description: Full nature details
   *
   *     TeamBuildSetInput:
   *       type: object
   *       required:
   *         - teamBuildId
   *         - pokemonId
   *       properties:
   *         teamBuildId:
   *           type: integer
   *           description: ID of the parent team build
   *           example: 1
   *           minimum: 1
   *         pokemonId:
   *           type: integer
   *           description: ID of the Pokemon (must match team build generation)
   *           example: 25
   *           minimum: 1
   *         pointValue:
   *           type: integer
   *           nullable: true
   *           description: Point value of this Pokemon
   *           example: 10
   *         condition:
   *           type: string
   *           nullable: true
   *           description: Special condition or note about this set
   *           example: "Tera Fire"
   *         itemId:
   *           type: integer
   *           nullable: true
   *           description: ID of the held item (must match team build generation)
   *           example: 5
   *           minimum: 1
   *         abilityId:
   *           type: integer
   *           nullable: true
   *           description: ID of the ability (must be in Pokemon's abilities list)
   *           example: 12
   *           minimum: 1
   *         move1Id:
   *           type: integer
   *           nullable: true
   *           description: ID of the first move (must be in Pokemon's moves list)
   *           example: 100
   *           minimum: 1
   *         move2Id:
   *           type: integer
   *           nullable: true
   *           description: ID of the second move (must be in Pokemon's moves list)
   *           example: 200
   *           minimum: 1
   *         move3Id:
   *           type: integer
   *           nullable: true
   *           description: ID of the third move (must be in Pokemon's moves list)
   *           example: 300
   *           minimum: 1
   *         move4Id:
   *           type: integer
   *           nullable: true
   *           description: ID of the fourth move (must be in Pokemon's moves list)
   *           example: 400
   *           minimum: 1
   *         hpEv:
   *           type: integer
   *           description: HP effort value (0-252, default 0)
   *           example: 252
   *           minimum: 0
   *           maximum: 252
   *         attackEv:
   *           type: integer
   *           description: Attack effort value (0-252, default 0)
   *           example: 0
   *           minimum: 0
   *           maximum: 252
   *         defenseEv:
   *           type: integer
   *           description: Defense effort value (0-252, default 0)
   *           example: 4
   *           minimum: 0
   *           maximum: 252
   *         specialAttackEv:
   *           type: integer
   *           description: Special Attack effort value (0-252, default 0)
   *           example: 252
   *           minimum: 0
   *           maximum: 252
   *         specialDefenseEv:
   *           type: integer
   *           description: Special Defense effort value (0-252, default 0)
   *           example: 0
   *           minimum: 0
   *           maximum: 252
   *         speedEv:
   *           type: integer
   *           description: Speed effort value (0-252, default 0)
   *           example: 0
   *           minimum: 0
   *           maximum: 252
   *         hpIv:
   *           type: integer
   *           description: HP individual value (0-31, default 31)
   *           example: 31
   *           minimum: 0
   *           maximum: 31
   *         attackIv:
   *           type: integer
   *           description: Attack individual value (0-31, default 31)
   *           example: 0
   *           minimum: 0
   *           maximum: 31
   *         defenseIv:
   *           type: integer
   *           description: Defense individual value (0-31, default 31)
   *           example: 31
   *           minimum: 0
   *           maximum: 31
   *         specialAttackIv:
   *           type: integer
   *           description: Special Attack individual value (0-31, default 31)
   *           example: 31
   *           minimum: 0
   *           maximum: 31
   *         specialDefenseIv:
   *           type: integer
   *           description: Special Defense individual value (0-31, default 31)
   *           example: 31
   *           minimum: 0
   *           maximum: 31
   *         speedIv:
   *           type: integer
   *           description: Speed individual value (0-31, default 31)
   *           example: 31
   *           minimum: 0
   *           maximum: 31
   *         natureId:
   *           type: integer
   *           nullable: true
   *           description: ID of the nature
   *           example: 3
   *           minimum: 1
   *
   *     TeamBuildSetUpdateInput:
   *       type: object
   *       properties:
   *         teamBuildId:
   *           type: integer
   *           description: ID of the parent team build
   *           example: 1
   *           minimum: 1
   *         pokemonId:
   *           type: integer
   *           description: ID of the Pokemon (must match team build generation)
   *           example: 25
   *           minimum: 1
   *         pointValue:
   *           type: integer
   *           nullable: true
   *           description: Point value of this Pokemon
   *           example: 10
   *         condition:
   *           type: string
   *           nullable: true
   *           description: Special condition or note about this set
   *           example: "Tera Fire"
   *         itemId:
   *           type: integer
   *           nullable: true
   *           description: ID of the held item (must match team build generation)
   *           example: 5
   *           minimum: 1
   *         abilityId:
   *           type: integer
   *           nullable: true
   *           description: ID of the ability (must be in Pokemon's abilities list)
   *           example: 12
   *           minimum: 1
   *         move1Id:
   *           type: integer
   *           nullable: true
   *           description: ID of the first move (must be in Pokemon's moves list)
   *           example: 100
   *           minimum: 1
   *         move2Id:
   *           type: integer
   *           nullable: true
   *           description: ID of the second move (must be in Pokemon's moves list)
   *           example: 200
   *           minimum: 1
   *         move3Id:
   *           type: integer
   *           nullable: true
   *           description: ID of the third move (must be in Pokemon's moves list)
   *           example: 300
   *           minimum: 1
   *         move4Id:
   *           type: integer
   *           nullable: true
   *           description: ID of the fourth move (must be in Pokemon's moves list)
   *           example: 400
   *           minimum: 1
   *         hpEv:
   *           type: integer
   *           description: HP effort value (0-252)
   *           example: 252
   *           minimum: 0
   *           maximum: 252
   *         attackEv:
   *           type: integer
   *           description: Attack effort value (0-252)
   *           example: 0
   *           minimum: 0
   *           maximum: 252
   *         defenseEv:
   *           type: integer
   *           description: Defense effort value (0-252)
   *           example: 4
   *           minimum: 0
   *           maximum: 252
   *         specialAttackEv:
   *           type: integer
   *           description: Special Attack effort value (0-252)
   *           example: 252
   *           minimum: 0
   *           maximum: 252
   *         specialDefenseEv:
   *           type: integer
   *           description: Special Defense effort value (0-252)
   *           example: 0
   *           minimum: 0
   *           maximum: 252
   *         speedEv:
   *           type: integer
   *           description: Speed effort value (0-252)
   *           example: 0
   *           minimum: 0
   *           maximum: 252
   *         hpIv:
   *           type: integer
   *           description: HP individual value (0-31)
   *           example: 31
   *           minimum: 0
   *           maximum: 31
   *         attackIv:
   *           type: integer
   *           description: Attack individual value (0-31)
   *           example: 0
   *           minimum: 0
   *           maximum: 31
   *         defenseIv:
   *           type: integer
   *           description: Defense individual value (0-31)
   *           example: 31
   *           minimum: 0
   *           maximum: 31
   *         specialAttackIv:
   *           type: integer
   *           description: Special Attack individual value (0-31)
   *           example: 31
   *           minimum: 0
   *           maximum: 31
   *         specialDefenseIv:
   *           type: integer
   *           description: Special Defense individual value (0-31)
   *           example: 31
   *           minimum: 0
   *           maximum: 31
   *         speedIv:
   *           type: integer
   *           description: Speed individual value (0-31)
   *           example: 31
   *           minimum: 0
   *           maximum: 31
   *         natureId:
   *           type: integer
   *           nullable: true
   *           description: ID of the nature
   *           example: 3
   *           minimum: 1
   */

  /**
   * @swagger
   * /api/team-build-set:
   *   get:
   *     tags:
   *       - TeamBuildSet
   *     summary: Get all team build sets
   *     description: Retrieve a list of all team build sets with optional pagination, sorting, and full details
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
   *         description: Field name to sort by (e.g., pokemonId, pointValue)
   *         example: pokemonId
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
   *         description: Include full set details (team build, Pokemon, item, ability, moves, nature)
   *     responses:
   *       200:
   *         description: List of team build sets retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 oneOf:
   *                   - $ref: '#/components/schemas/TeamBuildSet'
   *                   - $ref: '#/components/schemas/TeamBuildSetFull'
   *             examples:
   *               basic:
   *                 summary: Basic team build set list
   *                 value:
   *                   - id: 1
   *                     teamBuildId: 1
   *                     pokemonId: 25
   *                     pointValue: 10
   *                     condition: "Tera Fire"
   *                     itemId: 5
   *                     abilityId: 12
   *                     move1Id: 100
   *                     move2Id: 200
   *                     move3Id: 300
   *                     move4Id: 400
   *                     hpEv: 252
   *                     attackEv: 0
   *                     defenseEv: 4
   *                     specialAttackEv: 252
   *                     specialDefenseEv: 0
   *                     speedEv: 0
   *                     hpIv: 31
   *                     attackIv: 0
   *                     defenseIv: 31
   *                     specialAttackIv: 31
   *                     specialDefenseIv: 31
   *                     speedIv: 31
   *                     natureId: 3
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
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
   * /api/team-build-set/{id}:
   *   get:
   *     tags:
   *       - TeamBuildSet
   *     summary: Get a team build set by ID
   *     description: Retrieve detailed information about a specific team build set
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the team build set
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full set details (team build, Pokemon, item, ability, moves, nature)
   *     responses:
   *       200:
   *         description: Team build set details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/TeamBuildSet'
   *                 - $ref: '#/components/schemas/TeamBuildSetFull'
   *       400:
   *         description: Invalid team build set ID format
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
   *         description: Team build set not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/team-build-set:
   *   post:
   *     tags:
   *       - TeamBuildSet
   *     summary: Create a new team build set
   *     description: |
   *       Create a new Pokemon set within a team build. Validation rules:
   *       - Pokemon must be from the same generation as the team build
   *       - Item must be from the same generation as the team build (if provided)
   *       - Ability must be in the Pokemon's abilities list (if provided)
   *       - All moves must be in the Pokemon's moves list (if provided)
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TeamBuildSetInput'
   *           examples:
   *             fullSet:
   *               summary: Create a fully specified set
   *               value:
   *                 teamBuildId: 1
   *                 pokemonId: 25
   *                 pointValue: 10
   *                 condition: "Tera Fire"
   *                 itemId: 5
   *                 abilityId: 12
   *                 move1Id: 100
   *                 move2Id: 200
   *                 move3Id: 300
   *                 move4Id: 400
   *                 hpEv: 252
   *                 attackEv: 0
   *                 defenseEv: 4
   *                 specialAttackEv: 252
   *                 specialDefenseEv: 0
   *                 speedEv: 0
   *                 attackIv: 0
   *                 natureId: 3
   *             minimal:
   *               summary: Create with minimal required fields
   *               value:
   *                 teamBuildId: 1
   *                 pokemonId: 6
   *     responses:
   *       201:
   *         description: Team build set created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/TeamBuildSet'
   *       400:
   *         description: Invalid input data or validation constraint failed
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               generationMismatch:
   *                 summary: Pokemon generation does not match
   *                 value:
   *                   error: "Pokemon generation (2) does not match team build generation (1)"
   *                   statusCode: 400
   *                   timestamp: "2024-01-20T10:00:00.000Z"
   *               invalidAbility:
   *                 summary: Ability not in Pokemon's list
   *                 value:
   *                   error: "Ability with id 99 is not in Pikachu's abilities list"
   *                   statusCode: 400
   *                   timestamp: "2024-01-20T10:00:00.000Z"
   *               invalidMove:
   *                 summary: Move not in Pokemon's list
   *                 value:
   *                   error: "Move with id 500 is not in Pikachu's moves list"
   *                   statusCode: 400
   *                   timestamp: "2024-01-20T10:00:00.000Z"
   *       401:
   *         description: User not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/team-build-set/{id}:
   *   put:
   *     tags:
   *       - TeamBuildSet
   *     summary: Update a team build set
   *     description: |
   *       Update an existing team build set. All fields are optional for partial updates.
   *       The same validation rules apply as for creation.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the team build set
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full set details in the response
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TeamBuildSetUpdateInput'
   *           examples:
   *             updateMoves:
   *               summary: Update moves only
   *               value:
   *                 move1Id: 150
   *                 move2Id: 250
   *             updateEvs:
   *               summary: Update EV spread
   *               value:
   *                 hpEv: 0
   *                 attackEv: 252
   *                 speedEv: 252
   *                 defenseEv: 4
   *             updateItem:
   *               summary: Change held item
   *               value:
   *                 itemId: 10
   *     responses:
   *       200:
   *         description: Team build set updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/TeamBuildSet'
   *                 - $ref: '#/components/schemas/TeamBuildSetFull'
   *       400:
   *         description: Invalid input data or validation constraint failed
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
   *         description: Team build set not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/team-build-set/{id}:
   *   delete:
   *     tags:
   *       - TeamBuildSet
   *     summary: Delete a team build set
   *     description: |
   *       Permanently delete a team build set.
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
   *         description: Unique identifier of the team build set to delete
   *         example: 1
   *     responses:
   *       204:
   *         description: Team build set deleted successfully (no content returned)
   *       400:
   *         description: Invalid team build set ID format
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
   *         description: Team build set not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "TeamBuildSet not found"
   *               statusCode: 404
   *               timestamp: "2024-01-20T16:00:00.000Z"
   */
}
