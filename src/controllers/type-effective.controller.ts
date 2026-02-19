import { Request, Router } from 'express';
import { TypeEffectiveService } from '../services/type-effective.service';
import { BaseController } from './base.controller';
import { TypeEffective } from '../entities/type-effective.entity';
import { validateDto, validatePartialDto } from '../middleware/validation.middleware';
import { TypeEffectiveInputDto, TypeEffectiveOutputDto } from '../dtos/type-effective.dto';
import { FindOptionsWhere, FindOptionsRelations } from 'typeorm';
import { plainToInstance } from 'class-transformer';

export class TypeEffectiveController extends BaseController<
  TypeEffective,
  TypeEffectiveInputDto,
  TypeEffectiveOutputDto
> {
  public router = Router();

  constructor(private typeEffectiveService: TypeEffectiveService) {
    super(typeEffectiveService, TypeEffectiveOutputDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', this.getAll);
    this.router.get('/:id', this.getById);
    this.router.post('/', validateDto(TypeEffectiveInputDto), this.create);
    this.router.put('/:id', validatePartialDto(TypeEffectiveInputDto), this.update);
    this.router.delete('/:id', this.delete);
  }

  protected getFullTransformGroup(): string[] {
    return ['typeEffective.full'];
  }

  protected getAllowedSortFields(): string[] {
    return ['id', 'value', 'createdAt', 'updatedAt'];
  }

  protected async getWhere(
    req: Request,
  ): Promise<FindOptionsWhere<TypeEffective> | FindOptionsWhere<TypeEffective>[] | undefined> {
    return plainToInstance(TypeEffectiveInputDto, req.query, { excludeExtraneousValues: true });
  }

  protected getBaseRelations(): FindOptionsRelations<TypeEffective> | undefined {
    return undefined;
  }

  protected getFullRelations(): FindOptionsRelations<TypeEffective> | undefined {
    return undefined;
  }

  /**
   * @swagger
   * tags:
   *   name: TypeEffective
   *   description: Type effectiveness management and operations
   *
   * components:
   *   schemas:
   *     TypeEffective:
   *       type: object
   *       required:
   *         - id
   *         - pokemonId
   *         - pokemonTypeId
   *         - value
   *         - isActive
   *         - createdAt
   *         - updatedAt
   *       properties:
   *         id:
   *           type: integer
   *           description: Unique identifier of the type effectiveness entry
   *           example: 1
   *         pokemonId:
   *           type: integer
   *           description: ID of the Pokemon
   *           example: 25
   *         pokemonTypeId:
   *           type: integer
   *           description: ID of the Pokemon type
   *           example: 3
   *         value:
   *           type: number
   *           format: double
   *           description: Effectiveness multiplier (0.5 for not very effective, 2.0 for super effective, etc.)
   *           example: 2.0
   *         isActive:
   *           type: boolean
   *           description: Whether the type effectiveness entry is currently active
   *           example: true
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the type effectiveness entry was created
   *           example: "2024-01-01T00:00:00.000Z"
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the type effectiveness entry was last updated
   *           example: "2024-01-15T12:30:00.000Z"
   *
   *     TypeEffectiveFull:
   *       allOf:
   *         - $ref: '#/components/schemas/TypeEffective'
   *         - type: object
   *           properties:
   *             pokemonType:
   *               $ref: '#/components/schemas/PokemonType'
   *               description: Full Pokemon type details
   *             pokemon:
   *               $ref: '#/components/schemas/Pokemon'
   *               description: Full Pokemon details
   *
   *     TypeEffectiveInput:
   *       type: object
   *       required:
   *         - pokemonId
   *         - pokemonTypeId
   *         - value
   *       properties:
   *         pokemonId:
   *           type: integer
   *           description: ID of the Pokemon
   *           example: 25
   *           minimum: 1
   *         pokemonTypeId:
   *           type: integer
   *           description: ID of the Pokemon type
   *           example: 3
   *           minimum: 1
   *         value:
   *           type: number
   *           format: double
   *           description: Effectiveness multiplier
   *           example: 2.0
   *           minimum: 0
   *           maximum: 4
   *
   *     TypeEffectiveUpdateInput:
   *       type: object
   *       properties:
   *         pokemonId:
   *           type: integer
   *           description: ID of the Pokemon
   *           example: 25
   *           minimum: 1
   *         pokemonTypeId:
   *           type: integer
   *           description: ID of the Pokemon type
   *           example: 3
   *           minimum: 1
   *         value:
   *           type: number
   *           format: double
   *           description: Effectiveness multiplier
   *           example: 2.0
   *           minimum: 0
   *           maximum: 4
   */

  /**
   * @swagger
   * /api/type-effective:
   *   get:
   *     tags:
   *       - TypeEffective
   *     summary: Get all type effectiveness entries
   *     description: Retrieve a list of all type effectiveness entries with optional pagination, sorting, and full details
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
   *         description: Field name to sort by (e.g., pokemonId, pokemonTypeId, value)
   *         example: value
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
   *         description: Include full type effectiveness details (pokemonType and pokemon)
   *     responses:
   *       200:
   *         description: List of type effectiveness entries retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 oneOf:
   *                   - $ref: '#/components/schemas/TypeEffective'
   *                   - $ref: '#/components/schemas/TypeEffectiveFull'
   *             examples:
   *               basic:
   *                 summary: Basic type effectiveness list
   *                 value:
   *                   - id: 1
   *                     pokemonId: 25
   *                     pokemonTypeId: 3
   *                     value: 2.0
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 2
   *                     pokemonId: 25
   *                     pokemonTypeId: 5
   *                     value: 0.5
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
   * /api/type-effective/{id}:
   *   get:
   *     tags:
   *       - TypeEffective
   *     summary: Get a type effectiveness entry by ID
   *     description: Retrieve detailed information about a specific type effectiveness entry
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the type effectiveness entry
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full type effectiveness details (pokemonType and pokemon)
   *     responses:
   *       200:
   *         description: Type effectiveness entry details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/TypeEffective'
   *                 - $ref: '#/components/schemas/TypeEffectiveFull'
   *             examples:
   *               basic:
   *                 summary: Basic type effectiveness details
   *                 value:
   *                   id: 1
   *                   pokemonId: 25
   *                   pokemonTypeId: 3
   *                   value: 2.0
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *       400:
   *         description: Invalid type effectiveness ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Type effectiveness entry not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/type-effective:
   *   post:
   *     tags:
   *       - TypeEffective
   *     summary: Create a new type effectiveness entry
   *     description: Create a new type effectiveness relationship between a Pokemon and a type
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TypeEffectiveInput'
   *           examples:
   *             superEffective:
   *               summary: Create a super effective relationship
   *               value:
   *                 pokemonId: 25
   *                 pokemonTypeId: 3
   *                 value: 2.0
   *             notVeryEffective:
   *               summary: Create a not very effective relationship
   *               value:
   *                 pokemonId: 6
   *                 pokemonTypeId: 11
   *                 value: 0.5
   *             immune:
   *               summary: Create an immunity relationship
   *               value:
   *                 pokemonId: 94
   *                 pokemonTypeId: 1
   *                 value: 0
   *     responses:
   *       201:
   *         description: Type effectiveness entry created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/TypeEffective'
   *             example:
   *               id: 3
   *               pokemonId: 25
   *               pokemonTypeId: 3
   *               value: 2.0
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
   *               error: "pokemonId: must be a number; value: must be a number"
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
   * /api/type-effective/{id}:
   *   put:
   *     tags:
   *       - TypeEffective
   *     summary: Update a type effectiveness entry
   *     description: Update an existing type effectiveness entry. All fields are optional for partial updates.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the type effectiveness entry
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full type effectiveness details in the response
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TypeEffectiveUpdateInput'
   *           examples:
   *             updateValue:
   *               summary: Update only the effectiveness value
   *               value:
   *                 value: 1.5
   *             updateType:
   *               summary: Update the Pokemon type
   *               value:
   *                 pokemonTypeId: 5
   *             updateMultiple:
   *               summary: Update multiple fields
   *               value:
   *                 pokemonTypeId: 5
   *                 value: 0.25
   *     responses:
   *       200:
   *         description: Type effectiveness entry updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/TypeEffective'
   *                 - $ref: '#/components/schemas/TypeEffectiveFull'
   *             example:
   *               id: 1
   *               pokemonId: 25
   *               pokemonTypeId: 5
   *               value: 0.25
   *               isActive: true
   *               createdAt: "2024-01-01T00:00:00.000Z"
   *               updatedAt: "2024-01-20T15:00:00.000Z"
   *       400:
   *         description: Invalid type effectiveness ID format or invalid input data
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
   *         description: Type effectiveness entry not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/type-effective/{id}:
   *   delete:
   *     tags:
   *       - TypeEffective
   *     summary: Delete a type effectiveness entry
   *     description: |
   *       Permanently delete a type effectiveness entry.
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
   *         description: Unique identifier of the type effectiveness entry to delete
   *         example: 1
   *     responses:
   *       204:
   *         description: Type effectiveness entry deleted successfully (no content returned)
   *       400:
   *         description: Invalid type effectiveness ID format
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
   *         description: Type effectiveness entry not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Type effectiveness entry not found"
   *               statusCode: 404
   *               timestamp: "2024-01-20T16:00:00.000Z"
   */
}
