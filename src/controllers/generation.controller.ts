import { Request, Router } from 'express';
import { GenerationService } from '../services/generation.service';
import { BaseController } from './base.controller';
import { Generation } from '../entities/generation.entity';
import { validateDto, validatePartialDto } from '../middleware/validation.middleware';
import { GenerationInputDto, GenerationOutputDto } from '../dtos/generation.dto';
import { FindOptionsWhere, FindOptionsRelations } from 'typeorm';
import { plainToInstance } from 'class-transformer';

export class GenerationController extends BaseController<
  Generation,
  GenerationInputDto,
  GenerationOutputDto
> {
  public router = Router();

  constructor(private generationService: GenerationService) {
    super(generationService, GenerationOutputDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', this.getAll);
    this.router.get('/:id', this.getById);
    this.router.post('/', validateDto(GenerationInputDto), this.create);
    this.router.put('/:id', validatePartialDto(GenerationInputDto), this.update);
    this.router.delete('/:id', this.delete);
  }

  protected getFullTransformGroup(): string[] {
    return ['generation.full'];
  }

  protected async getWhere(
    req: Request,
  ): Promise<FindOptionsWhere<Generation> | FindOptionsWhere<Generation>[] | undefined> {
    return plainToInstance(GenerationInputDto, req.query, { excludeExtraneousValues: true });
  }

  protected getBaseRelations(): FindOptionsRelations<Generation> | undefined {
    return undefined;
  }

  protected getFullRelations(): FindOptionsRelations<Generation> | undefined {
    return {
      pokemon: true,
      moves: true,
      abilities: true,
      seasons: true,
    };
  }

  /**
   * @swagger
   * tags:
   *   name: Generation
   *   description: Pokemon generation management and operations
   *
   * components:
   *   schemas:
   *     Generation:
   *       type: object
   *       required:
   *         - id
   *         - name
   *         - isActive
   *         - createdAt
   *         - updatedAt
   *       properties:
   *         id:
   *           type: integer
   *           description: Unique identifier of the generation
   *           example: 1
   *         name:
   *           type: string
   *           description: Name of the Pokemon generation
   *           example: "Generation IX"
   *         isActive:
   *           type: boolean
   *           description: Whether the generation is currently active
   *           example: true
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the generation was created
   *           example: "2024-01-01T00:00:00.000Z"
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the generation was last updated
   *           example: "2024-01-15T12:30:00.000Z"
   *
   *     GenerationFull:
   *       allOf:
   *         - $ref: '#/components/schemas/Generation'
   *         - type: object
   *           properties:
   *             pokemon:
   *               type: array
   *               description: List of Pokemon belonging to this generation
   *               items:
   *                 $ref: '#/components/schemas/Pokemon'
   *             moves:
   *               type: array
   *               description: List of moves belonging to this generation
   *               items:
   *                 $ref: '#/components/schemas/Move'
   *             abilities:
   *               type: array
   *               description: List of abilities belonging to this generation
   *               items:
   *                 $ref: '#/components/schemas/Ability'
   *             seasons:
   *               type: array
   *               description: List of seasons associated with this generation
   *               items:
   *                 $ref: '#/components/schemas/Season'
   *
   *     GenerationInput:
   *       type: object
   *       required:
   *         - name
   *       properties:
   *         name:
   *           type: string
   *           description: Name of the Pokemon generation
   *           example: "Generation IX"
   *           minLength: 1
   *           maxLength: 50
   *
   *     GenerationUpdateInput:
   *       type: object
   *       properties:
   *         name:
   *           type: string
   *           description: Name of the Pokemon generation
   *           example: "Generation IX - Paldea"
   *           minLength: 1
   *           maxLength: 50
   */

  /**
   * @swagger
   * /api/generation:
   *   get:
   *     tags:
   *       - Generation
   *     summary: Get all generations
   *     description: Retrieve a list of all Pokemon generations with optional pagination, sorting, and full details
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
   *         description: Include full generation details (Pokemon, moves, abilities, seasons)
   *     responses:
   *       200:
   *         description: List of generations retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 oneOf:
   *                   - $ref: '#/components/schemas/Generation'
   *                   - $ref: '#/components/schemas/GenerationFull'
   *             examples:
   *               basic:
   *                 summary: Basic generation list
   *                 value:
   *                   - id: 1
   *                     name: "Generation I"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 2
   *                     name: "Generation II"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 9
   *                     name: "Generation IX"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full generation details
   *                 value:
   *                   - id: 9
   *                     name: "Generation IX"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                     pokemon: []
   *                     moves: []
   *                     abilities: []
   *                     seasons: []
   *       400:
   *         description: Invalid query parameters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/generation/{id}:
   *   get:
   *     tags:
   *       - Generation
   *     summary: Get a generation by ID
   *     description: Retrieve detailed information about a specific Pokemon generation
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the generation
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full generation details (Pokemon, moves, abilities, seasons)
   *     responses:
   *       200:
   *         description: Generation details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/Generation'
   *                 - $ref: '#/components/schemas/GenerationFull'
   *             examples:
   *               basic:
   *                 summary: Basic generation details
   *                 value:
   *                   id: 9
   *                   name: "Generation IX"
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full generation details with Pokemon, moves, abilities, and seasons
   *                 value:
   *                   id: 9
   *                   name: "Generation IX"
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *                   pokemon: []
   *                   moves: []
   *                   abilities: []
   *                   seasons: []
   *       400:
   *         description: Invalid generation ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Generation not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/generation:
   *   post:
   *     tags:
   *       - Generation
   *     summary: Create a new generation
   *     description: Create a new Pokemon generation
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GenerationInput'
   *           examples:
   *             standardGeneration:
   *               summary: Create a standard generation
   *               value:
   *                 name: "Generation X"
   *             namedGeneration:
   *               summary: Create a generation with region name
   *               value:
   *                 name: "Generation X - New Region"
   *     responses:
   *       201:
   *         description: Generation created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Generation'
   *             example:
   *               id: 10
   *               name: "Generation X"
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
   *               error: "name: must be a string; name: must not be empty"
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
   * /api/generation/{id}:
   *   put:
   *     tags:
   *       - Generation
   *     summary: Update a generation
   *     description: Update an existing Pokemon generation. All fields are optional for partial updates.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the generation
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full generation details in the response (Pokemon and moves)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GenerationUpdateInput'
   *           examples:
   *             updateName:
   *               summary: Update the generation name
   *               value:
   *                 name: "Generation IX - Paldea & Kitakami"
   *     responses:
   *       200:
   *         description: Generation updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/Generation'
   *                 - $ref: '#/components/schemas/GenerationFull'
   *             example:
   *               id: 9
   *               name: "Generation IX - Paldea & Kitakami"
   *               isActive: true
   *               createdAt: "2024-01-01T00:00:00.000Z"
   *               updatedAt: "2024-01-20T15:00:00.000Z"
   *       400:
   *         description: Invalid generation ID format or invalid input data
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
   *         description: Generation not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/generation/{id}:
   *   delete:
   *     tags:
   *       - Generation
   *     summary: Delete a generation
   *     description: |
   *       Permanently delete a Pokemon generation.
   *       This action cannot be undone.
   *       Note: Ensure no Pokemon or moves are associated with this generation before deletion.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the generation to delete
   *         example: 1
   *     responses:
   *       204:
   *         description: Generation deleted successfully (no content returned)
   *       400:
   *         description: Invalid generation ID format
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
   *         description: Generation not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Generation not found"
   *               statusCode: 404
   *               timestamp: "2024-01-20T16:00:00.000Z"
   */
}
