import { Request, Router } from 'express';
import { PokemonTypeService } from '../services/pokemon-type.service';
import { BaseController } from './base.controller';
import { PokemonType } from '../entities/pokemon-type.entity';
import { validateDto, validatePartialDto } from '../middleware/validation.middleware';
import { isAdmin } from '../middleware/auth.middleware';
import { PokemonTypeInputDto, PokemonTypeOutputDto } from '../dtos/pokemon-type.dto';
import { FindOptionsWhere, FindOptionsRelations } from 'typeorm';
import { plainToInstance } from 'class-transformer';

export class PokemonTypeController extends BaseController<PokemonType, PokemonTypeInputDto, PokemonTypeOutputDto> {
  public router = Router();

  constructor(private pokemonTypeService: PokemonTypeService) {
    super(pokemonTypeService, PokemonTypeOutputDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Public pokemon type routes
    this.router.get('/', this.getAll);
    this.router.get('/:id', this.getById);

    // Authenticated routes
    this.router.post('/', isAdmin, validateDto(PokemonTypeInputDto), this.create);
    this.router.put('/:id', isAdmin, validatePartialDto(PokemonTypeInputDto), this.update);
    this.router.delete('/:id', isAdmin, this.delete);
  }

  protected getFullTransformGroup(): string[] {
    return ['pokemonType.full'];
  }

  protected async getWhere(req: Request): Promise<FindOptionsWhere<PokemonType> | undefined> {
    return plainToInstance(PokemonTypeInputDto, req.query, { excludeExtraneousValues: true });
  }

  protected getBaseRelations(): FindOptionsRelations<PokemonType> | undefined {
    return undefined;
  }

  protected getFullRelations(): FindOptionsRelations<PokemonType> | undefined {
    return undefined;
  }

  /**
   * @swagger
   * tags:
   *   name: PokemonType
   *   description: Pokemon type management and operations
   * 
   * components:
   *   schemas:
   *     PokemonType:
   *       type: object
   *       required:
   *         - id
   *         - name
   *         - color
   *         - isActive
   *         - createdAt
   *         - updatedAt
   *       properties:
   *         id:
   *           type: integer
   *           description: Unique identifier of the Pokemon type
   *           example: 1
   *         name:
   *           type: string
   *           description: Name of the Pokemon type
   *           example: "Electric"
   *         color:
   *           type: string
   *           description: Color associated with this type (hex code)
   *           example: "#F8D030"
   *         isActive:
   *           type: boolean
   *           description: Whether the Pokemon type is currently active
   *           example: true
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the Pokemon type was created
   *           example: "2024-01-01T00:00:00.000Z"
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the Pokemon type was last updated
   *           example: "2024-01-15T12:30:00.000Z"
   *     
   *     PokemonTypeFull:
   *       allOf:
   *         - $ref: '#/components/schemas/PokemonType'
   *         - type: object
   *           properties:
   *             moves:
   *               type: array
   *               description: List of moves of this type
   *               items:
   *                 $ref: '#/components/schemas/Move'
   *             pokemon:
   *               type: array
   *               description: List of Pokemon with this type
   *               items:
   *                 $ref: '#/components/schemas/Pokemon'
   *             typeEffectiveness:
   *               type: array
   *               description: Type effectiveness relationships
   *               items:
   *                 $ref: '#/components/schemas/TypeEffective'
   *     
   *     PokemonTypeInput:
   *       type: object
   *       required:
   *         - name
   *         - color
   *       properties:
   *         name:
   *           type: string
   *           description: Name of the Pokemon type
   *           example: "Electric"
   *           minLength: 1
   *           maxLength: 50
   *         color:
   *           type: string
   *           description: Color associated with this type (hex code)
   *           example: "#F8D030"
   *           pattern: "^#[0-9A-Fa-f]{6}$"
   *     
   *     PokemonTypeUpdateInput:
   *       type: object
   *       properties:
   *         name:
   *           type: string
   *           description: Name of the Pokemon type
   *           example: "Electric"
   *           minLength: 1
   *           maxLength: 50
   *         color:
   *           type: string
   *           description: Color associated with this type (hex code)
   *           example: "#FFD700"
   *           pattern: "^#[0-9A-Fa-f]{6}$"
   */

  /**
   * @swagger
   * /api/pokemon-type:
   *   get:
   *     tags:
   *       - PokemonType
   *     summary: Get all Pokemon types
   *     description: Retrieve a list of all Pokemon types with optional pagination, sorting, and full details
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
   *         description: Include full type details (moves, Pokemon, and type effectiveness)
   *     responses:
   *       200:
   *         description: List of Pokemon types retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 oneOf:
   *                   - $ref: '#/components/schemas/PokemonType'
   *                   - $ref: '#/components/schemas/PokemonTypeFull'
   *             examples:
   *               basic:
   *                 summary: Basic Pokemon type list
   *                 value:
   *                   - id: 1
   *                     name: "Normal"
   *                     color: "#A8A878"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 2
   *                     name: "Fire"
   *                     color: "#F08030"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 3
   *                     name: "Water"
   *                     color: "#6890F0"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 4
   *                     name: "Electric"
   *                     color: "#F8D030"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full Pokemon type details
   *                 value:
   *                   - id: 4
   *                     name: "Electric"
   *                     color: "#F8D030"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                     moves: []
   *                     pokemon: []
   *                     typeEffectiveness: []
   *       400:
   *         description: Invalid query parameters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/pokemon-type/{id}:
   *   get:
   *     tags:
   *       - PokemonType
   *     summary: Get a Pokemon type by ID
   *     description: Retrieve detailed information about a specific Pokemon type
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the Pokemon type
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full type details (moves, Pokemon, and type effectiveness)
   *     responses:
   *       200:
   *         description: Pokemon type details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/PokemonType'
   *                 - $ref: '#/components/schemas/PokemonTypeFull'
   *             examples:
   *               basic:
   *                 summary: Basic Pokemon type details
   *                 value:
   *                   id: 4
   *                   name: "Electric"
   *                   color: "#F8D030"
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full Pokemon type details with relations
   *                 value:
   *                   id: 4
   *                   name: "Electric"
   *                   color: "#F8D030"
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *                   moves: []
   *                   pokemon: []
   *                   typeEffectiveness: []
   *       400:
   *         description: Invalid Pokemon type ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Pokemon type not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/pokemon-type:
   *   post:
   *     tags:
   *       - PokemonType
   *     summary: Create a new Pokemon type
   *     description: Create a new Pokemon type with a name and color
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/PokemonTypeInput'
   *           examples:
   *             fairy:
   *               summary: Create Fairy type
   *               value:
   *                 name: "Fairy"
   *                 color: "#EE99AC"
   *             dark:
   *               summary: Create Dark type
   *               value:
   *                 name: "Dark"
   *                 color: "#705848"
   *             steel:
   *               summary: Create Steel type
   *               value:
   *                 name: "Steel"
   *                 color: "#B8B8D0"
   *     responses:
   *       201:
   *         description: Pokemon type created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PokemonType'
   *             example:
   *               id: 18
   *               name: "Fairy"
   *               color: "#EE99AC"
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
   *               error: "name: must be a string; color: must be a valid hex color"
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
   * /api/pokemon-type/{id}:
   *   put:
   *     tags:
   *       - PokemonType
   *     summary: Update a Pokemon type
   *     description: Update an existing Pokemon type. All fields are optional for partial updates.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the Pokemon type
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full type details in the response (moves, Pokemon, and type effectiveness)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/PokemonTypeUpdateInput'
   *           examples:
   *             updateColor:
   *               summary: Update type color
   *               value:
   *                 color: "#FFD700"
   *             updateName:
   *               summary: Update type name
   *               value:
   *                 name: "Lightning"
   *             updateBoth:
   *               summary: Update both fields
   *               value:
   *                 name: "Thunder"
   *                 color: "#FFE933"
   *     responses:
   *       200:
   *         description: Pokemon type updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/PokemonType'
   *                 - $ref: '#/components/schemas/PokemonTypeFull'
   *             example:
   *               id: 4
   *               name: "Electric"
   *               color: "#FFD700"
   *               isActive: true
   *               createdAt: "2024-01-01T00:00:00.000Z"
   *               updatedAt: "2024-01-20T15:00:00.000Z"
   *       400:
   *         description: Invalid Pokemon type ID format or invalid input data
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
   *         description: Pokemon type not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/pokemon-type/{id}:
   *   delete:
   *     tags:
   *       - PokemonType
   *     summary: Delete a Pokemon type
   *     description: |
   *       Permanently delete a Pokemon type.
   *       This action cannot be undone.
   *       Note: Ensure no Pokemon or moves are using this type before deletion.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the Pokemon type to delete
   *         example: 1
   *     responses:
   *       204:
   *         description: Pokemon type deleted successfully (no content returned)
   *       400:
   *         description: Invalid Pokemon type ID format
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
   *         description: Pokemon type not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Pokemon type not found"
   *               statusCode: 404
   *               timestamp: "2024-01-20T16:00:00.000Z"
   */
}