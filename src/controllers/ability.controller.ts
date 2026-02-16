import { Request, Router } from 'express';
import { AbilityService } from '../services/ability.service';
import { BaseController } from './base.controller';
import { Ability } from '../entities/ability.entity';
import { validateDto, validatePartialDto } from '../middleware/validation.middleware';
import { AbilityInputDto, AbilityOutputDto } from '../dtos/ability.dto';
import { FindOptionsWhere, FindOptionsRelations } from 'typeorm';
import { plainToInstance } from 'class-transformer';

export class AbilityController extends BaseController<Ability, AbilityInputDto, AbilityOutputDto> {
  public router = Router();

  constructor(private abilityService: AbilityService) {
    super(abilityService, AbilityOutputDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', this.getAll);
    this.router.get('/:id', this.getById);
    this.router.post('/', validateDto(AbilityInputDto), this.create);
    this.router.put('/:id', validatePartialDto(AbilityInputDto), this.update);
    this.router.delete('/:id', this.delete);
  }

  protected getFullTransformGroup(): string[] {
    return ['ability.full', 'pokemon.full'];
  }

  protected async getWhere(
    req: Request,
  ): Promise<FindOptionsWhere<Ability> | FindOptionsWhere<Ability>[] | undefined> {
    return plainToInstance(AbilityInputDto, req.query, {
      excludeExtraneousValues: true,
    });
  }

  protected getBaseRelations(): FindOptionsRelations<Ability> | undefined {
    return {
      generation: true,
    };
  }

  protected getFullRelations(): FindOptionsRelations<Ability> | undefined {
    return {
      pokemon: true,
      generation: true,
    };
  }

  /**
   * @swagger
   * tags:
   *   name: Ability
   *   description: Pokemon ability management and operations
   *
   * components:
   *   schemas:
   *     Ability:
   *       type: object
   *       required:
   *         - id
   *         - name
   *         - description
   *         - generationId
   *         - isActive
   *         - createdAt
   *         - updatedAt
   *       properties:
   *         id:
   *           type: integer
   *           description: Unique identifier of the ability
   *           example: 1
   *         name:
   *           type: string
   *           description: Name of the ability
   *           example: "Intimidate"
   *         description:
   *           type: string
   *           description: Detailed description of what the ability does
   *           example: "Lowers the opposing team's Attack stat upon entering battle"
   *         generationId:
   *           type: integer
   *           description: ID of the generation this ability belongs to
   *           example: 3
   *         isActive:
   *           type: boolean
   *           description: Whether the ability is currently active
   *           example: true
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the ability was created
   *           example: "2024-01-01T00:00:00.000Z"
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the ability was last updated
   *           example: "2024-01-15T12:30:00.000Z"
   *
   *     AbilityFull:
   *       allOf:
   *         - $ref: '#/components/schemas/Ability'
   *         - type: object
   *           properties:
   *             pokemon:
   *               type: array
   *               description: List of Pokemon that can have this ability
   *               items:
   *                 $ref: '#/components/schemas/Pokemon'
   *             generation:
   *               $ref: '#/components/schemas/Generation'
   *               description: Generation this ability belongs to
   *
   *     AbilityInput:
   *       type: object
   *       required:
   *         - name
   *         - description
   *         - generationId
   *       properties:
   *         name:
   *           type: string
   *           description: Name of the ability
   *           example: "Intimidate"
   *           minLength: 1
   *           maxLength: 100
   *         description:
   *           type: string
   *           description: Detailed description of what the ability does
   *           example: "Lowers the opposing team's Attack stat upon entering battle"
   *           minLength: 1
   *           maxLength: 500
   *         generationId:
   *           type: integer
   *           description: ID of the generation this ability belongs to
   *           example: 3
   *           minimum: 1
   *
   *     AbilityUpdateInput:
   *       type: object
   *       properties:
   *         name:
   *           type: string
   *           description: Name of the ability
   *           example: "Intimidate"
   *           minLength: 1
   *           maxLength: 100
   *         description:
   *           type: string
   *           description: Detailed description of what the ability does
   *           example: "Lowers the opposing team's Attack stat by one stage upon entering battle"
   *           minLength: 1
   *           maxLength: 500
   *         generationId:
   *           type: integer
   *           description: ID of the generation this ability belongs to
   *           example: 3
   *           minimum: 1
   */

  /**
   * @swagger
   * /api/ability:
   *   get:
   *     tags:
   *       - Ability
   *     summary: Get all abilities
   *     description: Retrieve a list of all Pokemon abilities with optional pagination, sorting, and full details
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
   *         description: Include full ability details (list of Pokemon with this ability, generation)
   *     responses:
   *       200:
   *         description: List of abilities retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 oneOf:
   *                   - $ref: '#/components/schemas/Ability'
   *                   - $ref: '#/components/schemas/AbilityFull'
   *             examples:
   *               basic:
   *                 summary: Basic ability list
   *                 value:
   *                   - id: 1
   *                     name: "Intimidate"
   *                     description: "Lowers the opposing team's Attack stat upon entering battle"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 2
   *                     name: "Levitate"
   *                     description: "Gives immunity to Ground-type moves"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full ability details
   *                 value:
   *                   - id: 1
   *                     name: "Intimidate"
   *                     description: "Lowers the opposing team's Attack stat upon entering battle"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                     pokemon: []
   *                     generation: {}
   *       400:
   *         description: Invalid query parameters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/ability/{id}:
   *   get:
   *     tags:
   *       - Ability
   *     summary: Get an ability by ID
   *     description: Retrieve detailed information about a specific Pokemon ability
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the ability
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full ability details (list of Pokemon with this ability, generation)
   *     responses:
   *       200:
   *         description: Ability details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/Ability'
   *                 - $ref: '#/components/schemas/AbilityFull'
   *             examples:
   *               basic:
   *                 summary: Basic ability details
   *                 value:
   *                   id: 1
   *                   name: "Intimidate"
   *                   description: "Lowers the opposing team's Attack stat upon entering battle"
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full ability details with Pokemon and generation
   *                 value:
   *                   id: 1
   *                   name: "Intimidate"
   *                   description: "Lowers the opposing team's Attack stat upon entering battle"
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *                   pokemon: []
   *                   generation: {}
   *       400:
   *         description: Invalid ability ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Ability not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/ability:
   *   post:
   *     tags:
   *       - Ability
   *     summary: Create a new ability
   *     description: Create a new Pokemon ability with name and description
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/AbilityInput'
   *           examples:
   *             standard:
   *               summary: Create a standard ability
   *               value:
   *                 name: "Swift Swim"
   *                 description: "Doubles the Pokemon's Speed stat in rain"
   *             hidden:
   *               summary: Create a hidden ability
   *               value:
   *                 name: "Protean"
   *                 description: "Changes the Pokemon's type to the type of the move it's about to use"
   *     responses:
   *       201:
   *         description: Ability created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Ability'
   *             example:
   *               id: 3
   *               name: "Swift Swim"
   *               description: "Doubles the Pokemon's Speed stat in rain"
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
   *               error: "name: must be a string; description: must not be empty"
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
   * /api/ability/{id}:
   *   put:
   *     tags:
   *       - Ability
   *     summary: Update an ability
   *     description: Update an existing Pokemon ability. All fields are optional for partial updates.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the ability
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full ability details in the response (list of Pokemon with this ability, generation)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/AbilityUpdateInput'
   *           examples:
   *             updateDescription:
   *               summary: Update only the description
   *               value:
   *                 description: "Lowers the opposing team's Attack stat by one stage upon entering battle"
   *             updateName:
   *               summary: Update only the name
   *               value:
   *                 name: "Intimidation"
   *             updateMultiple:
   *               summary: Update multiple fields
   *               value:
   *                 name: "Strong Intimidate"
   *                 description: "Significantly lowers the opposing team's Attack stat upon entering battle"
   *     responses:
   *       200:
   *         description: Ability updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/Ability'
   *                 - $ref: '#/components/schemas/AbilityFull'
   *             example:
   *               id: 1
   *               name: "Strong Intimidate"
   *               description: "Significantly lowers the opposing team's Attack stat upon entering battle"
   *               isActive: true
   *               createdAt: "2024-01-01T00:00:00.000Z"
   *               updatedAt: "2024-01-20T15:00:00.000Z"
   *       400:
   *         description: Invalid ability ID format or invalid input data
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
   *         description: Ability not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/ability/{id}:
   *   delete:
   *     tags:
   *       - Ability
   *     summary: Delete an ability
   *     description: |
   *       Permanently delete a Pokemon ability.
   *       This action cannot be undone.
   *       Note: Ensure no Pokemon are currently using this ability before deletion.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the ability to delete
   *         example: 1
   *     responses:
   *       204:
   *         description: Ability deleted successfully (no content returned)
   *       400:
   *         description: Invalid ability ID format
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
   *         description: Ability not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Ability not found"
   *               statusCode: 404
   *               timestamp: "2024-01-20T16:00:00.000Z"
   */
}
