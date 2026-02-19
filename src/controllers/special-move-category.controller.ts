import { Request, Router } from 'express';
import { SpecialMoveCategoryService } from '../services/special-move-category.service';
import { BaseController } from './base.controller';
import { SpecialMoveCategory } from '../entities/special-move-category.entity';
import { validateDto, validatePartialDto } from '../middleware/validation.middleware';
import { SpecialMoveCategoryInputDto, SpecialMoveCategoryOutputDto } from '../dtos/special-move-category.dto';
import { FindOptionsWhere, FindOptionsRelations } from 'typeorm';
import { plainToInstance } from 'class-transformer';

export class SpecialMoveCategoryController extends BaseController<
  SpecialMoveCategory,
  SpecialMoveCategoryInputDto,
  SpecialMoveCategoryOutputDto
> {
  public router = Router();

  constructor(private specialMoveCategoryService: SpecialMoveCategoryService) {
    super(specialMoveCategoryService, SpecialMoveCategoryOutputDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', this.getAll);
    this.router.get('/:id', this.getById);
    this.router.post('/', validateDto(SpecialMoveCategoryInputDto), this.create);
    this.router.put('/:id', validatePartialDto(SpecialMoveCategoryInputDto), this.update);
    this.router.delete('/:id', this.delete);
  }

  protected getFullTransformGroup(): string[] {
    return ['specialMoveCategory.full'];
  }

  protected getAllowedSortFields(): string[] {
    return ['id', 'createdAt', 'updatedAt'];
  }

  protected async getWhere(
    req: Request,
  ): Promise<
    FindOptionsWhere<SpecialMoveCategory> | FindOptionsWhere<SpecialMoveCategory>[] | undefined
  > {
    return plainToInstance(SpecialMoveCategoryInputDto, req.query, {
      excludeExtraneousValues: true,
    });
  }

  protected getBaseRelations(): FindOptionsRelations<SpecialMoveCategory> | undefined {
    return undefined;
  }

  protected getFullRelations(): FindOptionsRelations<SpecialMoveCategory> | undefined {
    return undefined;
  }

  /**
   * @swagger
   * tags:
   *   name: SpecialMoveCategory
   *   description: Special move category management and operations
   *
   * components:
   *   schemas:
   *     SpecialMoveCategory:
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
   *           description: Unique identifier of the Special move category
   *           example: 1
   *         name:
   *           type: string
   *           description: Name of the Special move category
   *           example: "Momentum"
   *         isActive:
   *           type: boolean
   *           description: Whether the Special move category is currently active
   *           example: true
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the Special move category was created
   *           example: "2024-01-01T00:00:00.000Z"
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the Special move category was last updated
   *           example: "2024-01-15T12:30:00.000Z"
   *
   *     SpecialMoveCategoryFull:
   *       allOf:
   *         - $ref: '#/components/schemas/SpecialMoveCategory'
   *         - type: object
   *           properties:
   *             moves:
   *               type: array
   *               description: List of moves of this category
   *               items:
   *                 $ref: '#/components/schemas/Move'
   *
   *     SpecialMoveCategoryInput:
   *       type: object
   *       required:
   *         - name
   *       properties:
   *         name:
   *           type: string
   *           description: Name of the Special move category
   *           example: "Momentum"
   *           minLength: 1
   *           maxLength: 50
   *
   *     SpecialMoveCategoryUpdateInput:
   *       type: object
   *       properties:
   *         name:
   *           type: string
   *           description: Name of the Special move category
   *           example: "Momentum"
   *           minLength: 1
   *           maxLength: 50
   */

  /**
   * @swagger
   * /api/special-move-category:
   *   get:
   *     tags:
   *       - SpecialMoveCategory
   *     summary: Get all Special move categorys
   *     description: Retrieve a list of all Special move categorys with optional pagination, sorting, and full details
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
   *         description: Include full category details (moves)
   *     responses:
   *       200:
   *         description: List of Special move categorys retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 oneOf:
   *                   - $ref: '#/components/schemas/SpecialMoveCategory'
   *                   - $ref: '#/components/schemas/SpecialMoveCategoryFull'
   *             examples:
   *               basic:
   *                 summary: Basic Special move category list
   *                 value:
   *                   - id: 1
   *                     name: "Momentum"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 2
   *                     name: "Disruption"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 3
   *                     name: "Hazard Removal"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 4
   *                     name: "Harzard"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full Special move category details
   *                 value:
   *                   - id: 4
   *                     name: "Momentum"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                     moves: []
   *       400:
   *         description: Invalid query parameters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/special-move-category/{id}:
   *   get:
   *     tags:
   *       - SpecialMoveCategory
   *     summary: Get a Special move category by ID
   *     description: Retrieve detailed information about a specific Special move category
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the Special move category
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full category details (moves)
   *     responses:
   *       200:
   *         description: Special move category details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/SpecialMoveCategory'
   *                 - $ref: '#/components/schemas/SpecialMoveCategoryFull'
   *             examples:
   *               basic:
   *                 summary: Basic Special move category details
   *                 value:
   *                   id: 4
   *                   name: "Momentum"
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full Special move category details with relations
   *                 value:
   *                   id: 4
   *                   name: "Momentum"
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *                   moves: []
   *       400:
   *         description: Invalid Special move category ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Special move category not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/special-move-category:
   *   post:
   *     tags:
   *       - SpecialMoveCategory
   *     summary: Create a new Special move category
   *     description: Create a new Special move category with a name
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SpecialMoveCategoryInput'
   *           examples:
   *             momentum:
   *               summary: Create Momentum category
   *               value:
   *                 name: "Momentum"
   *             hazard:
   *               summary: Create Hazard category
   *               value:
   *                 name: "Hazard"
   *             disruption:
   *               summary: Create Disruption category
   *               value:
   *                 name: "Disruption"
   *     responses:
   *       201:
   *         description: Special move category created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SpecialMoveCategory'
   *             example:
   *               id: 18
   *               name: "Momentum"
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
   *               error: "name: must be a string"
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
   * /api/special-move-category/{id}:
   *   put:
   *     tags:
   *       - SpecialMoveCategory
   *     summary: Update a Special move category
   *     description: Update an existing Special move category. All fields are optional for partial updates.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the Special move category
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full category details in the response (moves)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SpecialMoveCategoryUpdateInput'
   *           examples:
   *             updateName:
   *               summary: Update category name
   *               value:
   *                 name: "Momentum"
   *     responses:
   *       200:
   *         description: Special move category updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/SpecialMoveCategory'
   *                 - $ref: '#/components/schemas/SpecialMoveCategoryFull'
   *             example:
   *               id: 4
   *               name: "Momentum"
   *               isActive: true
   *               createdAt: "2024-01-01T00:00:00.000Z"
   *               updatedAt: "2024-01-20T15:00:00.000Z"
   *       400:
   *         description: Invalid Special move category ID format or invalid input data
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
   *         description: Special move category not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/special-move-category/{id}:
   *   delete:
   *     tags:
   *       - SpecialMoveCategory
   *     summary: Delete a Special move category
   *     description: |
   *       Permanently delete a Special move category.
   *       This action cannot be undone.
   *       Note: Ensure no moves are using this category before deletion.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the Special move category to delete
   *         example: 1
   *     responses:
   *       204:
   *         description: Special move category deleted successfully (no content returned)
   *       400:
   *         description: Invalid Special move category ID format
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
   *         description: Special move category not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Special move category not found"
   *               statusCode: 404
   *               timestamp: "2024-01-20T16:00:00.000Z"
   */
}
