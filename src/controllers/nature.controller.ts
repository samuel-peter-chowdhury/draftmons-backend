import { Request, Router } from 'express';
import { NatureService } from '../services/nature.service';
import { BaseController } from './base.controller';
import { Nature } from '../entities/nature.entity';
import { validateDto, validatePartialDto } from '../middleware/validation.middleware';
import { NatureInputDto, NatureOutputDto } from '../dtos/nature.dto';
import { FindOptionsWhere, FindOptionsRelations } from 'typeorm';
import { plainToInstance } from 'class-transformer';

export class NatureController extends BaseController<Nature, NatureInputDto, NatureOutputDto> {
  public router = Router();

  constructor(private natureService: NatureService) {
    super(natureService, NatureOutputDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', this.getAll);
    this.router.get('/:id', this.getById);
    this.router.post('/', validateDto(NatureInputDto), this.create);
    this.router.put('/:id', validatePartialDto(NatureInputDto), this.update);
    this.router.delete('/:id', this.delete);
  }

  protected getFullTransformGroup(): string[] {
    return ['nature.full'];
  }

  protected getAllowedSortFields(): string[] {
    return ['id', 'name', 'positiveStat', 'negativeStat', 'createdAt', 'updatedAt'];
  }

  protected async getWhere(
    req: Request,
  ): Promise<FindOptionsWhere<Nature> | FindOptionsWhere<Nature>[] | undefined> {
    const where = plainToInstance(NatureInputDto, req.query, {
      excludeExtraneousValues: true,
    }) as unknown as Record<string, unknown>;
    // Remove null values since FindOptionsWhere doesn't accept null
    if (where.positiveStat === null) delete where.positiveStat;
    if (where.negativeStat === null) delete where.negativeStat;
    return where as FindOptionsWhere<Nature>;
  }

  protected getBaseRelations(): FindOptionsRelations<Nature> | undefined {
    return undefined;
  }

  protected getFullRelations(): FindOptionsRelations<Nature> | undefined {
    return undefined;
  }

  /**
   * @swagger
   * tags:
   *   name: Nature
   *   description: Pokemon nature management and operations
   *
   * components:
   *   schemas:
   *     Nature:
   *       type: object
   *       required:
   *         - id
   *         - name
   *         - description
   *         - isActive
   *         - createdAt
   *         - updatedAt
   *       properties:
   *         id:
   *           type: integer
   *           description: Unique identifier of the nature
   *           example: 1
   *         name:
   *           type: string
   *           description: Name of the nature
   *           example: "Adamant"
   *         description:
   *           type: string
   *           description: Description of the nature's effect
   *           example: "Increases Attack, decreases Special Attack."
   *         positiveStat:
   *           type: string
   *           nullable: true
   *           description: The stat that is increased by this nature
   *           enum: [HP, ATTACK, DEFENSE, SPECIAL_ATTACK, SPECIAL_DEFENSE, SPEED]
   *           example: "ATTACK"
   *         negativeStat:
   *           type: string
   *           nullable: true
   *           description: The stat that is decreased by this nature
   *           enum: [HP, ATTACK, DEFENSE, SPECIAL_ATTACK, SPECIAL_DEFENSE, SPEED]
   *           example: "SPECIAL_ATTACK"
   *         isActive:
   *           type: boolean
   *           description: Whether the nature is currently active
   *           example: true
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the nature was created
   *           example: "2024-01-01T00:00:00.000Z"
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the nature was last updated
   *           example: "2024-01-15T12:30:00.000Z"
   *
   *     NatureInput:
   *       type: object
   *       required:
   *         - name
   *         - description
   *       properties:
   *         name:
   *           type: string
   *           description: Name of the nature
   *           example: "Adamant"
   *           minLength: 1
   *           maxLength: 50
   *         description:
   *           type: string
   *           description: Description of the nature's effect
   *           example: "Increases Attack, decreases Special Attack."
   *           maxLength: 500
   *         positiveStat:
   *           type: string
   *           nullable: true
   *           description: The stat that is increased by this nature
   *           enum: [HP, ATTACK, DEFENSE, SPECIAL_ATTACK, SPECIAL_DEFENSE, SPEED]
   *           example: "ATTACK"
   *         negativeStat:
   *           type: string
   *           nullable: true
   *           description: The stat that is decreased by this nature
   *           enum: [HP, ATTACK, DEFENSE, SPECIAL_ATTACK, SPECIAL_DEFENSE, SPEED]
   *           example: "SPECIAL_ATTACK"
   *
   *     NatureUpdateInput:
   *       type: object
   *       properties:
   *         name:
   *           type: string
   *           description: Name of the nature
   *           example: "Jolly"
   *           minLength: 1
   *           maxLength: 50
   *         description:
   *           type: string
   *           description: Description of the nature's effect
   *           example: "Increases Speed, decreases Special Attack."
   *           maxLength: 500
   *         positiveStat:
   *           type: string
   *           nullable: true
   *           description: The stat that is increased by this nature
   *           enum: [HP, ATTACK, DEFENSE, SPECIAL_ATTACK, SPECIAL_DEFENSE, SPEED]
   *           example: "SPEED"
   *         negativeStat:
   *           type: string
   *           nullable: true
   *           description: The stat that is decreased by this nature
   *           enum: [HP, ATTACK, DEFENSE, SPECIAL_ATTACK, SPECIAL_DEFENSE, SPEED]
   *           example: "SPECIAL_ATTACK"
   */

  /**
   * @swagger
   * /api/nature:
   *   get:
   *     tags:
   *       - Nature
   *     summary: Get all natures
   *     description: Retrieve a list of all Pokemon natures with optional pagination and sorting
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
   *         description: Field name to sort by (e.g., name, positiveStat)
   *         example: name
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [ASC, DESC]
   *           default: ASC
   *         description: Sort order (ascending or descending)
   *     responses:
   *       200:
   *         description: List of natures retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Nature'
   *             examples:
   *               basic:
   *                 summary: Basic nature list
   *                 value:
   *                   - id: 1
   *                     name: "Adamant"
   *                     description: "Increases Attack, decreases Special Attack."
   *                     positiveStat: "ATTACK"
   *                     negativeStat: "SPECIAL_ATTACK"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 2
   *                     name: "Jolly"
   *                     description: "Increases Speed, decreases Special Attack."
   *                     positiveStat: "SPEED"
   *                     negativeStat: "SPECIAL_ATTACK"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 3
   *                     name: "Hardy"
   *                     description: "No stat modifications."
   *                     positiveStat: null
   *                     negativeStat: null
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
   * /api/nature/{id}:
   *   get:
   *     tags:
   *       - Nature
   *     summary: Get a nature by ID
   *     description: Retrieve detailed information about a specific Pokemon nature
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the nature
   *         example: 1
   *     responses:
   *       200:
   *         description: Nature details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Nature'
   *             examples:
   *               withStats:
   *                 summary: Nature with stat modifiers
   *                 value:
   *                   id: 1
   *                   name: "Adamant"
   *                   description: "Increases Attack, decreases Special Attack."
   *                   positiveStat: "ATTACK"
   *                   negativeStat: "SPECIAL_ATTACK"
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *               neutral:
   *                 summary: Neutral nature (no stat changes)
   *                 value:
   *                   id: 3
   *                   name: "Hardy"
   *                   description: "No stat modifications."
   *                   positiveStat: null
   *                   negativeStat: null
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *       400:
   *         description: Invalid nature ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Nature not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/nature:
   *   post:
   *     tags:
   *       - Nature
   *     summary: Create a new nature
   *     description: Create a new Pokemon nature with optional stat modifiers
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/NatureInput'
   *           examples:
   *             statNature:
   *               summary: Create a nature with stat modifiers
   *               value:
   *                 name: "Adamant"
   *                 description: "Increases Attack, decreases Special Attack."
   *                 positiveStat: "ATTACK"
   *                 negativeStat: "SPECIAL_ATTACK"
   *             neutralNature:
   *               summary: Create a neutral nature
   *               value:
   *                 name: "Hardy"
   *                 description: "No stat modifications."
   *                 positiveStat: null
   *                 negativeStat: null
   *     responses:
   *       201:
   *         description: Nature created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Nature'
   *             example:
   *               id: 4
   *               name: "Adamant"
   *               description: "Increases Attack, decreases Special Attack."
   *               positiveStat: "ATTACK"
   *               negativeStat: "SPECIAL_ATTACK"
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
   *               error: "name: must be a string; positiveStat: must be one of the following values: HP, ATTACK, DEFENSE, SPECIAL_ATTACK, SPECIAL_DEFENSE, SPEED"
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
   * /api/nature/{id}:
   *   put:
   *     tags:
   *       - Nature
   *     summary: Update a nature
   *     description: Update an existing Pokemon nature. All fields are optional for partial updates.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the nature
   *         example: 1
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/NatureUpdateInput'
   *           examples:
   *             updateName:
   *               summary: Update the nature name
   *               value:
   *                 name: "Brave"
   *             updateStats:
   *               summary: Update stat modifiers
   *               value:
   *                 positiveStat: "ATTACK"
   *                 negativeStat: "SPEED"
   *     responses:
   *       200:
   *         description: Nature updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Nature'
   *             example:
   *               id: 1
   *               name: "Brave"
   *               description: "Increases Attack, decreases Speed."
   *               positiveStat: "ATTACK"
   *               negativeStat: "SPEED"
   *               isActive: true
   *               createdAt: "2024-01-01T00:00:00.000Z"
   *               updatedAt: "2024-01-20T15:00:00.000Z"
   *       400:
   *         description: Invalid nature ID format or invalid input data
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
   *         description: Nature not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/nature/{id}:
   *   delete:
   *     tags:
   *       - Nature
   *     summary: Delete a nature
   *     description: |
   *       Permanently delete a Pokemon nature.
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
   *         description: Unique identifier of the nature to delete
   *         example: 1
   *     responses:
   *       204:
   *         description: Nature deleted successfully (no content returned)
   *       400:
   *         description: Invalid nature ID format
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
   *         description: Nature not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Nature not found"
   *               statusCode: 404
   *               timestamp: "2024-01-20T16:00:00.000Z"
   */
}
