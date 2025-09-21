import { Request, Router } from 'express';
import { MoveService } from '../services/move.service';
import { BaseController } from './base.controller';
import { Move } from '../entities/move.entity';
import { validateDto, validatePartialDto } from '../middleware/validation.middleware';
import { isAdmin } from '../middleware/auth.middleware';
import { MoveInputDto, MoveOutputDto } from '../dtos/move.dto';
import { FindOptionsWhere, FindOptionsRelations } from 'typeorm';
import { plainToInstance } from 'class-transformer';

export class MoveController extends BaseController<Move, MoveInputDto, MoveOutputDto> {
  public router = Router();

  constructor(private moveService: MoveService) {
    super(moveService, MoveOutputDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Public move routes
    this.router.get('/', this.getAll);
    this.router.get('/:id', this.getById);

    // Authenticated routes
    this.router.post('/', isAdmin, validateDto(MoveInputDto), this.create);
    this.router.put('/:id', isAdmin, validatePartialDto(MoveInputDto), this.update);
    this.router.delete('/:id', isAdmin, this.delete);
  }

  protected getFullTransformGroup(): string[] {
    return ['move.full'];
  }

  protected async getWhere(req: Request): Promise<FindOptionsWhere<Move> | undefined> {
    return plainToInstance(MoveInputDto, req.query, { excludeExtraneousValues: true });
  }

  protected getBaseRelations(): FindOptionsRelations<Move> | undefined {
    return undefined;
  }

  protected getFullRelations(): FindOptionsRelations<Move> | undefined {
    return undefined;
  }

  /**
   * @swagger
   * tags:
   *   name: Move
   *   description: Pokemon move management and operations
   * 
   * components:
   *   schemas:
   *     Move:
   *       type: object
   *       required:
   *         - id
   *         - name
   *         - pokemonTypeId
   *         - category
   *         - power
   *         - accuracy
   *         - priority
   *         - pp
   *         - description
   *         - isActive
   *         - createdAt
   *         - updatedAt
   *       properties:
   *         id:
   *           type: integer
   *           description: Unique identifier of the move
   *           example: 1
   *         name:
   *           type: string
   *           description: Name of the move
   *           example: "Thunderbolt"
   *         pokemonTypeId:
   *           type: integer
   *           description: ID of the Pokemon type for this move
   *           example: 4
   *         category:
   *           type: string
   *           description: Category of the move
   *           enum: [PHYSICAL, SPECIAL, STATUS]
   *           example: "SPECIAL"
   *         power:
   *           type: integer
   *           description: Base power of the move (0 for status moves)
   *           example: 90
   *         accuracy:
   *           type: integer
   *           description: Accuracy percentage of the move
   *           example: 100
   *         priority:
   *           type: integer
   *           description: Priority bracket of the move
   *           example: 0
   *         pp:
   *           type: integer
   *           description: Power Points (number of times the move can be used)
   *           example: 15
   *         description:
   *           type: string
   *           description: Detailed description of the move's effects
   *           example: "A strong electric blast crashes down on the target. This may also leave the target with paralysis."
   *         isActive:
   *           type: boolean
   *           description: Whether the move is currently active
   *           example: true
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the move was created
   *           example: "2024-01-01T00:00:00.000Z"
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the move was last updated
   *           example: "2024-01-15T12:30:00.000Z"
   *     
   *     MoveFull:
   *       allOf:
   *         - $ref: '#/components/schemas/Move'
   *         - type: object
   *           properties:
   *             pokemonType:
   *               $ref: '#/components/schemas/PokemonType'
   *               description: Full type details for this move
   *             pokemonMoves:
   *               type: array
   *               description: List of Pokemon that can learn this move
   *               items:
   *                 $ref: '#/components/schemas/PokemonMove'
   *     
   *     MoveInput:
   *       type: object
   *       required:
   *         - name
   *         - pokemonTypeId
   *         - category
   *         - power
   *         - accuracy
   *         - priority
   *         - pp
   *         - description
   *       properties:
   *         name:
   *           type: string
   *           description: Name of the move
   *           example: "Thunderbolt"
   *           minLength: 1
   *           maxLength: 100
   *         pokemonTypeId:
   *           type: integer
   *           description: ID of the Pokemon type for this move
   *           example: 4
   *           minimum: 1
   *         category:
   *           type: string
   *           description: Category of the move
   *           enum: [PHYSICAL, SPECIAL, STATUS]
   *           example: "SPECIAL"
   *         power:
   *           type: integer
   *           description: Base power of the move
   *           example: 90
   *           minimum: 0
   *           maximum: 250
   *         accuracy:
   *           type: integer
   *           description: Accuracy percentage of the move
   *           example: 100
   *           minimum: 0
   *           maximum: 100
   *         priority:
   *           type: integer
   *           description: Priority bracket of the move
   *           example: 0
   *           minimum: -7
   *           maximum: 5
   *         pp:
   *           type: integer
   *           description: Power Points
   *           example: 15
   *           minimum: 1
   *           maximum: 40
   *         description:
   *           type: string
   *           description: Detailed description of the move's effects
   *           example: "A strong electric blast crashes down on the target. This may also leave the target with paralysis."
   *           maxLength: 500
   *     
   *     MoveUpdateInput:
   *       type: object
   *       properties:
   *         name:
   *           type: string
   *           description: Name of the move
   *           example: "Thunder"
   *           minLength: 1
   *           maxLength: 100
   *         pokemonTypeId:
   *           type: integer
   *           description: ID of the Pokemon type for this move
   *           example: 4
   *           minimum: 1
   *         category:
   *           type: string
   *           description: Category of the move
   *           enum: [PHYSICAL, SPECIAL, STATUS]
   *           example: "SPECIAL"
   *         power:
   *           type: integer
   *           description: Base power of the move
   *           example: 110
   *           minimum: 0
   *           maximum: 250
   *         accuracy:
   *           type: integer
   *           description: Accuracy percentage of the move
   *           example: 70
   *           minimum: 0
   *           maximum: 100
   *         priority:
   *           type: integer
   *           description: Priority bracket of the move
   *           example: 0
   *           minimum: -7
   *           maximum: 5
   *         pp:
   *           type: integer
   *           description: Power Points
   *           example: 10
   *           minimum: 1
   *           maximum: 40
   *         description:
   *           type: string
   *           description: Detailed description of the move's effects
   *           example: "A wicked thunderbolt is dropped on the target to inflict damage. This may also leave the target with paralysis."
   *           maxLength: 500
   */

  /**
   * @swagger
   * /api/move:
   *   get:
   *     tags:
   *       - Move
   *     summary: Get all moves
   *     description: Retrieve a list of all Pokemon moves with optional pagination, sorting, and full details
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
   *         description: Field name to sort by (e.g., name, power, accuracy)
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
   *         description: Include full move details (type and Pokemon that can learn it)
   *     responses:
   *       200:
   *         description: List of moves retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 oneOf:
   *                   - $ref: '#/components/schemas/Move'
   *                   - $ref: '#/components/schemas/MoveFull'
   *             examples:
   *               basic:
   *                 summary: Basic move list
   *                 value:
   *                   - id: 1
   *                     name: "Thunderbolt"
   *                     pokemonTypeId: 4
   *                     category: "SPECIAL"
   *                     power: 90
   *                     accuracy: 100
   *                     priority: 0
   *                     pp: 15
   *                     description: "A strong electric blast crashes down on the target."
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 2
   *                     name: "Earthquake"
   *                     pokemonTypeId: 8
   *                     category: "PHYSICAL"
   *                     power: 100
   *                     accuracy: 100
   *                     priority: 0
   *                     pp: 10
   *                     description: "The user sets off an earthquake that strikes every Pokemon around it."
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full move details
   *                 value:
   *                   - id: 1
   *                     name: "Thunderbolt"
   *                     pokemonTypeId: 4
   *                     category: "SPECIAL"
   *                     power: 90
   *                     accuracy: 100
   *                     priority: 0
   *                     pp: 15
   *                     description: "A strong electric blast crashes down on the target."
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                     pokemonType: {}
   *                     pokemonMoves: []
   *       400:
   *         description: Invalid query parameters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/move/{id}:
   *   get:
   *     tags:
   *       - Move
   *     summary: Get a move by ID
   *     description: Retrieve detailed information about a specific Pokemon move
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the move
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full move details (type and Pokemon that can learn it)
   *     responses:
   *       200:
   *         description: Move details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/Move'
   *                 - $ref: '#/components/schemas/MoveFull'
   *             examples:
   *               basic:
   *                 summary: Basic move details
   *                 value:
   *                   id: 1
   *                   name: "Thunderbolt"
   *                   pokemonTypeId: 4
   *                   category: "SPECIAL"
   *                   power: 90
   *                   accuracy: 100
   *                   priority: 0
   *                   pp: 15
   *                   description: "A strong electric blast crashes down on the target."
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full move details with relations
   *                 value:
   *                   id: 1
   *                   name: "Thunderbolt"
   *                   pokemonTypeId: 4
   *                   category: "SPECIAL"
   *                   power: 90
   *                   accuracy: 100
   *                   priority: 0
   *                   pp: 15
   *                   description: "A strong electric blast crashes down on the target."
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *                   pokemonType: {}
   *                   pokemonMoves: []
   *       400:
   *         description: Invalid move ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Move not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/move:
   *   post:
   *     tags:
   *       - Move
   *     summary: Create a new move
   *     description: Create a new Pokemon move with all its properties
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MoveInput'
   *           examples:
   *             attackMove:
   *               summary: Create an attacking move
   *               value:
   *                 name: "Volt Tackle"
   *                 pokemonTypeId: 4
   *                 category: "PHYSICAL"
   *                 power: 120
   *                 accuracy: 100
   *                 priority: 0
   *                 pp: 15
   *                 description: "The user electrifies itself and charges the target. This also damages the user quite a lot."
   *             statusMove:
   *               summary: Create a status move
   *               value:
   *                 name: "Thunder Wave"
   *                 pokemonTypeId: 4
   *                 category: "STATUS"
   *                 power: 0
   *                 accuracy: 90
   *                 priority: 0
   *                 pp: 20
   *                 description: "The user launches a weak jolt of electricity that paralyzes the target."
   *             priorityMove:
   *               summary: Create a priority move
   *               value:
   *                 name: "Quick Attack"
   *                 pokemonTypeId: 1
   *                 category: "PHYSICAL"
   *                 power: 40
   *                 accuracy: 100
   *                 priority: 1
   *                 pp: 30
   *                 description: "The user lunges at the target at a speed that makes it almost invisible."
   *     responses:
   *       201:
   *         description: Move created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Move'
   *             example:
   *               id: 3
   *               name: "Volt Tackle"
   *               pokemonTypeId: 4
   *               category: "PHYSICAL"
   *               power: 120
   *               accuracy: 100
   *               priority: 0
   *               pp: 15
   *               description: "The user electrifies itself and charges the target."
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
   *               error: "name: must be a string; power: must be between 0 and 250"
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
   * /api/move/{id}:
   *   put:
   *     tags:
   *       - Move
   *     summary: Update a move
   *     description: Update an existing Pokemon move. All fields are optional for partial updates.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the move
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full move details in the response (type and Pokemon that can learn it)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MoveUpdateInput'
   *           examples:
   *             updatePower:
   *               summary: Update move power
   *               value:
   *                 power: 95
   *             updateAccuracy:
   *               summary: Update move accuracy
   *               value:
   *                 accuracy: 85
   *             updateDescription:
   *               summary: Update move description
   *               value:
   *                 description: "An updated, more detailed description of the move's effects."
   *             updateMultiple:
   *               summary: Update multiple fields
   *               value:
   *                 power: 100
   *                 accuracy: 95
   *                 pp: 10
   *     responses:
   *       200:
   *         description: Move updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/Move'
   *                 - $ref: '#/components/schemas/MoveFull'
   *             example:
   *               id: 1
   *               name: "Thunderbolt"
   *               pokemonTypeId: 4
   *               category: "SPECIAL"
   *               power: 95
   *               accuracy: 100
   *               priority: 0
   *               pp: 15
   *               description: "A strong electric blast crashes down on the target."
   *               isActive: true
   *               createdAt: "2024-01-01T00:00:00.000Z"
   *               updatedAt: "2024-01-20T15:00:00.000Z"
   *       400:
   *         description: Invalid move ID format or invalid input data
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
   *         description: Move not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/move/{id}:
   *   delete:
   *     tags:
   *       - Move
   *     summary: Delete a move
   *     description: |
   *       Permanently delete a Pokemon move.
   *       This action cannot be undone.
   *       Note: Ensure no Pokemon are currently using this move before deletion.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the move to delete
   *         example: 1
   *     responses:
   *       204:
   *         description: Move deleted successfully (no content returned)
   *       400:
   *         description: Invalid move ID format
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
   *         description: Move not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Move not found"
   *               statusCode: 404
   *               timestamp: "2024-01-20T16:00:00.000Z"
   */
}