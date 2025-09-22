import { Request, Router } from 'express';
import { PokemonMoveService } from '../services/pokemon-move.service';
import { BaseController } from './base.controller';
import { PokemonMove } from '../entities/pokemon-move.entity';
import { validateDto, validatePartialDto } from '../middleware/validation.middleware';
import { PokemonMoveInputDto, PokemonMoveOutputDto } from '../dtos/pokemon-move.dto';
import { FindOptionsWhere, FindOptionsRelations } from 'typeorm';
import { plainToInstance } from 'class-transformer';

export class PokemonMoveController extends BaseController<PokemonMove, PokemonMoveInputDto, PokemonMoveOutputDto> {
  public router = Router();

  constructor(private pokemonMoveService: PokemonMoveService) {
    super(pokemonMoveService, PokemonMoveOutputDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', this.getAll);
    this.router.get('/:id', this.getById);
    this.router.post('/', validateDto(PokemonMoveInputDto), this.create);
    this.router.put('/:id', validatePartialDto(PokemonMoveInputDto), this.update);
    this.router.delete('/:id', this.delete);
  }

  protected getFullTransformGroup(): string[] {
    return ['pokemonMove.full'];
  }

  protected async getWhere(req: Request): Promise<FindOptionsWhere<PokemonMove> | undefined> {
    return plainToInstance(PokemonMoveInputDto, req.query, { excludeExtraneousValues: true });
  }

  protected getBaseRelations(): FindOptionsRelations<PokemonMove> | undefined {
    return undefined;
  }

  protected getFullRelations(): FindOptionsRelations<PokemonMove> | undefined {
    return undefined;
  }

  /**
   * @swagger
   * tags:
   *   name: PokemonMove
   *   description: Pokemon move relationship management and operations
   * 
   * components:
   *   schemas:
   *     PokemonMove:
   *       type: object
   *       required:
   *         - id
   *         - pokemonId
   *         - moveId
   *         - generationId
   *         - isActive
   *         - createdAt
   *         - updatedAt
   *       properties:
   *         id:
   *           type: integer
   *           description: Unique identifier of the Pokemon move relationship
   *           example: 1
   *         pokemonId:
   *           type: integer
   *           description: ID of the Pokemon
   *           example: 25
   *         moveId:
   *           type: integer
   *           description: ID of the move
   *           example: 85
   *         generationId:
   *           type: integer
   *           description: ID of the generation when this Pokemon could learn this move
   *           example: 1
   *         isActive:
   *           type: boolean
   *           description: Whether the Pokemon move relationship is currently active
   *           example: true
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the Pokemon move relationship was created
   *           example: "2024-01-01T00:00:00.000Z"
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the Pokemon move relationship was last updated
   *           example: "2024-01-15T12:30:00.000Z"
   *     
   *     PokemonMoveFull:
   *       allOf:
   *         - $ref: '#/components/schemas/PokemonMove'
   *         - type: object
   *           properties:
   *             pokemon:
   *               $ref: '#/components/schemas/Pokemon'
   *               description: Full Pokemon details
   *             move:
   *               $ref: '#/components/schemas/Move'
   *               description: Full move details
   *             generation:
   *               $ref: '#/components/schemas/Generation'
   *               description: Full generation details
   *     
   *     PokemonMoveInput:
   *       type: object
   *       required:
   *         - pokemonId
   *         - moveId
   *         - generationId
   *       properties:
   *         pokemonId:
   *           type: integer
   *           description: ID of the Pokemon
   *           example: 25
   *           minimum: 1
   *         moveId:
   *           type: integer
   *           description: ID of the move
   *           example: 85
   *           minimum: 1
   *         generationId:
   *           type: integer
   *           description: ID of the generation
   *           example: 1
   *           minimum: 1
   *     
   *     PokemonMoveUpdateInput:
   *       type: object
   *       properties:
   *         pokemonId:
   *           type: integer
   *           description: ID of the Pokemon
   *           example: 25
   *           minimum: 1
   *         moveId:
   *           type: integer
   *           description: ID of the move
   *           example: 85
   *           minimum: 1
   *         generationId:
   *           type: integer
   *           description: ID of the generation
   *           example: 2
   *           minimum: 1
   */

  /**
   * @swagger
   * /api/pokemon-move:
   *   get:
   *     tags:
   *       - PokemonMove
   *     summary: Get all Pokemon moves
   *     description: Retrieve a list of all Pokemon move relationships with optional pagination, sorting, and full details
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
   *         description: Field name to sort by (e.g., pokemonId, moveId, generationId)
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
   *         description: Include full Pokemon move details (Pokemon, move, and generation information)
   *     responses:
   *       200:
   *         description: List of Pokemon moves retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 oneOf:
   *                   - $ref: '#/components/schemas/PokemonMove'
   *                   - $ref: '#/components/schemas/PokemonMoveFull'
   *             examples:
   *               basic:
   *                 summary: Basic Pokemon move list
   *                 value:
   *                   - id: 1
   *                     pokemonId: 25
   *                     moveId: 85
   *                     generationId: 1
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 2
   *                     pokemonId: 25
   *                     moveId: 21
   *                     generationId: 1
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full Pokemon move details
   *                 value:
   *                   - id: 1
   *                     pokemonId: 25
   *                     moveId: 85
   *                     generationId: 1
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                     pokemon: {}
   *                     move: {}
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
   * /api/pokemon-move/{id}:
   *   get:
   *     tags:
   *       - PokemonMove
   *     summary: Get a Pokemon move by ID
   *     description: Retrieve detailed information about a specific Pokemon move relationship
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the Pokemon move
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full Pokemon move details (Pokemon, move, and generation information)
   *     responses:
   *       200:
   *         description: Pokemon move details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/PokemonMove'
   *                 - $ref: '#/components/schemas/PokemonMoveFull'
   *             examples:
   *               basic:
   *                 summary: Basic Pokemon move details
   *                 value:
   *                   id: 1
   *                   pokemonId: 25
   *                   moveId: 85
   *                   generationId: 1
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full Pokemon move details with relations
   *                 value:
   *                   id: 1
   *                   pokemonId: 25
   *                   moveId: 85
   *                   generationId: 1
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *                   pokemon: {}
   *                   move: {}
   *                   generation: {}
   *       400:
   *         description: Invalid Pokemon move ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Pokemon move not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/pokemon-move:
   *   post:
   *     tags:
   *       - PokemonMove
   *     summary: Create a new Pokemon move
   *     description: Create a new relationship between a Pokemon and a move for a specific generation
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/PokemonMoveInput'
   *           examples:
   *             pikachuThunderbolt:
   *               summary: Pikachu learns Thunderbolt
   *               value:
   *                 pokemonId: 25
   *                 moveId: 85
   *                 generationId: 1
   *             charizardFlamethrower:
   *               summary: Charizard learns Flamethrower
   *               value:
   *                 pokemonId: 6
   *                 moveId: 53
   *                 generationId: 1
   *             newGenMove:
   *               summary: Pokemon learns move in new generation
   *               value:
   *                 pokemonId: 150
   *                 moveId: 396
   *                 generationId: 9
   *     responses:
   *       201:
   *         description: Pokemon move created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PokemonMove'
   *             example:
   *               id: 3
   *               pokemonId: 25
   *               moveId: 85
   *               generationId: 1
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
   *               error: "pokemonId: must be a number; moveId: must be a number"
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
   * /api/pokemon-move/{id}:
   *   put:
   *     tags:
   *       - PokemonMove
   *     summary: Update a Pokemon move
   *     description: Update an existing Pokemon move relationship. All fields are optional for partial updates.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the Pokemon move
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full Pokemon move details in the response (Pokemon, move, and generation information)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/PokemonMoveUpdateInput'
   *           examples:
   *             updateGeneration:
   *               summary: Update generation
   *               value:
   *                 generationId: 2
   *             updateMove:
   *               summary: Change to different move
   *               value:
   *                 moveId: 87
   *             updatePokemon:
   *               summary: Change to different Pokemon
   *               value:
   *                 pokemonId: 26
   *     responses:
   *       200:
   *         description: Pokemon move updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/PokemonMove'
   *                 - $ref: '#/components/schemas/PokemonMoveFull'
   *             example:
   *               id: 1
   *               pokemonId: 25
   *               moveId: 85
   *               generationId: 2
   *               isActive: true
   *               createdAt: "2024-01-01T00:00:00.000Z"
   *               updatedAt: "2024-01-20T15:00:00.000Z"
   *       400:
   *         description: Invalid Pokemon move ID format or invalid input data
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
   *         description: Pokemon move not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/pokemon-move/{id}:
   *   delete:
   *     tags:
   *       - PokemonMove
   *     summary: Delete a Pokemon move
   *     description: |
   *       Permanently delete a Pokemon move relationship.
   *       This action cannot be undone.
   *       This will remove the ability for a Pokemon to use a specific move.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the Pokemon move to delete
   *         example: 1
   *     responses:
   *       204:
   *         description: Pokemon move deleted successfully (no content returned)
   *       400:
   *         description: Invalid Pokemon move ID format
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
   *         description: Pokemon move not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Pokemon move not found"
   *               statusCode: 404
   *               timestamp: "2024-01-20T16:00:00.000Z"
   */
}