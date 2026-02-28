import { Request, Router } from 'express';
import { ItemService } from '../services/item.service';
import { BaseController } from './base.controller';
import { Item } from '../entities/item.entity';
import { validateDto, validatePartialDto } from '../middleware/validation.middleware';
import { ItemInputDto, ItemOutputDto } from '../dtos/item.dto';
import { FindOptionsWhere, FindOptionsRelations } from 'typeorm';
import { plainToInstance } from 'class-transformer';

export class ItemController extends BaseController<Item, ItemInputDto, ItemOutputDto> {
  public router = Router();

  constructor(private itemService: ItemService) {
    super(itemService, ItemOutputDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', this.getAll);
    this.router.get('/:id', this.getById);
    this.router.post('/', validateDto(ItemInputDto), this.create);
    this.router.put('/:id', validatePartialDto(ItemInputDto), this.update);
    this.router.delete('/:id', this.delete);
  }

  protected getFullTransformGroup(): string[] {
    return ['item.full'];
  }

  protected getAllowedSortFields(): string[] {
    return ['id', 'name', 'generationId', 'createdAt', 'updatedAt'];
  }

  protected async getWhere(
    req: Request,
  ): Promise<FindOptionsWhere<Item> | FindOptionsWhere<Item>[] | undefined> {
    return plainToInstance(ItemInputDto, req.query, { excludeExtraneousValues: true });
  }

  protected getBaseRelations(): FindOptionsRelations<Item> | undefined {
    return {
      generation: true,
    };
  }

  protected getFullRelations(): FindOptionsRelations<Item> | undefined {
    return {
      generation: true,
    };
  }

  /**
   * @swagger
   * tags:
   *   name: Item
   *   description: Pokemon item management and operations
   *
   * components:
   *   schemas:
   *     Item:
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
   *           description: Unique identifier of the item
   *           example: 1
   *         name:
   *           type: string
   *           description: Name of the item
   *           example: "Leftovers"
   *         description:
   *           type: string
   *           description: Description of the item's effect
   *           example: "An item to be held by a Pokemon. The holder's HP is slowly but steadily restored throughout every battle."
   *         generationId:
   *           type: integer
   *           description: ID of the generation this item was introduced in
   *           example: 2
   *         isActive:
   *           type: boolean
   *           description: Whether the item is currently active
   *           example: true
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the item was created
   *           example: "2024-01-01T00:00:00.000Z"
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the item was last updated
   *           example: "2024-01-15T12:30:00.000Z"
   *
   *     ItemFull:
   *       allOf:
   *         - $ref: '#/components/schemas/Item'
   *         - type: object
   *           properties:
   *             generation:
   *               $ref: '#/components/schemas/Generation'
   *               description: Generation this item was introduced in
   *
   *     ItemInput:
   *       type: object
   *       required:
   *         - name
   *         - description
   *         - generationId
   *       properties:
   *         name:
   *           type: string
   *           description: Name of the item
   *           example: "Leftovers"
   *           minLength: 1
   *           maxLength: 100
   *         description:
   *           type: string
   *           description: Description of the item's effect
   *           example: "An item to be held by a Pokemon. The holder's HP is slowly but steadily restored throughout every battle."
   *           maxLength: 500
   *         generationId:
   *           type: integer
   *           description: ID of the generation this item was introduced in
   *           example: 2
   *           minimum: 1
   *
   *     ItemUpdateInput:
   *       type: object
   *       properties:
   *         name:
   *           type: string
   *           description: Name of the item
   *           example: "Choice Band"
   *           minLength: 1
   *           maxLength: 100
   *         description:
   *           type: string
   *           description: Description of the item's effect
   *           example: "An item to be held by a Pokemon. This curious band boosts Attack but only allows the use of one move."
   *           maxLength: 500
   *         generationId:
   *           type: integer
   *           description: ID of the generation this item was introduced in
   *           example: 3
   *           minimum: 1
   */

  /**
   * @swagger
   * /api/item:
   *   get:
   *     tags:
   *       - Item
   *     summary: Get all items
   *     description: Retrieve a list of all Pokemon items with optional pagination, sorting, and full details
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
   *         description: Field name to sort by (e.g., name, generationId)
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
   *         description: Include full item details (generation)
   *     responses:
   *       200:
   *         description: List of items retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 oneOf:
   *                   - $ref: '#/components/schemas/Item'
   *                   - $ref: '#/components/schemas/ItemFull'
   *             examples:
   *               basic:
   *                 summary: Basic item list
   *                 value:
   *                   - id: 1
   *                     name: "Leftovers"
   *                     description: "An item to be held by a Pokemon. The holder's HP is slowly but steadily restored throughout every battle."
   *                     generationId: 2
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 2
   *                     name: "Choice Band"
   *                     description: "An item to be held by a Pokemon. This curious band boosts Attack but only allows the use of one move."
   *                     generationId: 3
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full item details
   *                 value:
   *                   - id: 1
   *                     name: "Leftovers"
   *                     description: "An item to be held by a Pokemon. The holder's HP is slowly but steadily restored throughout every battle."
   *                     generationId: 2
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
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
   * /api/item/{id}:
   *   get:
   *     tags:
   *       - Item
   *     summary: Get an item by ID
   *     description: Retrieve detailed information about a specific Pokemon item
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the item
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full item details (generation)
   *     responses:
   *       200:
   *         description: Item details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/Item'
   *                 - $ref: '#/components/schemas/ItemFull'
   *             examples:
   *               basic:
   *                 summary: Basic item details
   *                 value:
   *                   id: 1
   *                   name: "Leftovers"
   *                   description: "An item to be held by a Pokemon. The holder's HP is slowly but steadily restored throughout every battle."
   *                   generationId: 2
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full item details with generation
   *                 value:
   *                   id: 1
   *                   name: "Leftovers"
   *                   description: "An item to be held by a Pokemon. The holder's HP is slowly but steadily restored throughout every battle."
   *                   generationId: 2
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *                   generation: {}
   *       400:
   *         description: Invalid item ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Item not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/item:
   *   post:
   *     tags:
   *       - Item
   *     summary: Create a new item
   *     description: Create a new Pokemon item
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ItemInput'
   *           examples:
   *             heldItem:
   *               summary: Create a held item
   *               value:
   *                 name: "Life Orb"
   *                 description: "An item to be held by a Pokemon. It boosts the power of moves, but at the cost of some HP on each hit."
   *                 generationId: 4
   *             berry:
   *               summary: Create a berry
   *               value:
   *                 name: "Sitrus Berry"
   *                 description: "A Berry to be consumed by Pokemon. If a Pokemon holds one, it can restore its own HP by a small amount during battle."
   *                 generationId: 3
   *     responses:
   *       201:
   *         description: Item created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Item'
   *             example:
   *               id: 3
   *               name: "Life Orb"
   *               description: "An item to be held by a Pokemon. It boosts the power of moves, but at the cost of some HP on each hit."
   *               generationId: 4
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
   *               error: "name: must be a string; generationId: must be a number"
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
   * /api/item/{id}:
   *   put:
   *     tags:
   *       - Item
   *     summary: Update an item
   *     description: Update an existing Pokemon item. All fields are optional for partial updates.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the item
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full item details in the response (generation)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ItemUpdateInput'
   *           examples:
   *             updateName:
   *               summary: Update item name
   *               value:
   *                 name: "Choice Specs"
   *             updateDescription:
   *               summary: Update item description
   *               value:
   *                 description: "An item to be held by a Pokemon. These curious spectacles boost Special Attack but only allow the use of one move."
   *     responses:
   *       200:
   *         description: Item updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/Item'
   *                 - $ref: '#/components/schemas/ItemFull'
   *             example:
   *               id: 1
   *               name: "Choice Specs"
   *               description: "An item to be held by a Pokemon. These curious spectacles boost Special Attack but only allow the use of one move."
   *               generationId: 4
   *               isActive: true
   *               createdAt: "2024-01-01T00:00:00.000Z"
   *               updatedAt: "2024-01-20T15:00:00.000Z"
   *       400:
   *         description: Invalid item ID format or invalid input data
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
   *         description: Item not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/item/{id}:
   *   delete:
   *     tags:
   *       - Item
   *     summary: Delete an item
   *     description: |
   *       Permanently delete a Pokemon item.
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
   *         description: Unique identifier of the item to delete
   *         example: 1
   *     responses:
   *       204:
   *         description: Item deleted successfully (no content returned)
   *       400:
   *         description: Invalid item ID format
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
   *         description: Item not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Item not found"
   *               statusCode: 404
   *               timestamp: "2024-01-20T16:00:00.000Z"
   */
}
