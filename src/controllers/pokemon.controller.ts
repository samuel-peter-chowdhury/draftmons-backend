import { Request, Response, Router } from 'express';
import { PokemonService } from '../services/pokemon.service';
import { BaseController } from './base.controller';
import { Pokemon } from '../entities/pokemon.entity';
import {
  PokemonDto,
  CreatePokemonDto,
  UpdatePokemonDto,
  PokemonSearchDto,
} from '../dtos/pokemon.dto';
import { validateDto } from '../middleware/validation.middleware';
import { isAuthenticated, isAdmin } from '../middleware/auth.middleware';
import { ValidationError } from '../errors';
import { plainToInstance } from 'class-transformer';
import { asyncHandler } from '../utils/error.utils';
import { PaginationOptions } from '../services/base.service';

/**
 * @swagger
 * tags:
 *   name: Pokemon
 *   description: Pokemon management and operations
 * 
 * components:
 *   schemas:
 *     Pokemon:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         dexId:
 *           type: integer
 *         name:
 *           type: string
 *         hp:
 *           type: integer
 *         attack:
 *           type: integer
 *         defense:
 *           type: integer
 *         specialAttack:
 *           type: integer
 *         specialDefense:
 *           type: integer
 *         speed:
 *           type: integer
 *         baseStatTotal:
 *           type: integer
 *         height:
 *           type: number
 *         weight:
 *           type: number
 *         sprite:
 *           type: string
 *         pokemonTypes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PokemonType'
 *         abilities:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Ability'
 *         pokemonMoves:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PokemonMove'
 *         typeEffectiveness:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TypeEffective'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     PokemonType:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         color:
 *           type: string
 *     Ability:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *     PokemonMove:
 *       type: object
 *       properties:
 *         pokemonId:
 *           type: integer
 *         moveId:
 *           type: integer
 *         generationId:
 *           type: integer
 *         move:
 *           $ref: '#/components/schemas/Move'
 *     Move:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         pokemonType:
 *           $ref: '#/components/schemas/PokemonType'
 *         category:
 *           type: string
 *         power:
 *           type: integer
 *         accuracy:
 *           type: integer
 *         priority:
 *           type: integer
 *         pp:
 *           type: integer
 *         description:
 *           type: string
 *     TypeEffective:
 *       type: object
 *       properties:
 *         pokemonId:
 *           type: integer
 *         pokemonType:
 *           $ref: '#/components/schemas/PokemonType'
 *         value:
 *           type: number
 */

export class PokemonController extends BaseController<Pokemon, PokemonDto> {
  public router = Router();

  constructor(private pokemonService: PokemonService) {
    super(pokemonService, PokemonDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Public routes
    this.router.get('/', isAuthenticated, this.getAllPokemon);
    this.router.get('/:id', isAuthenticated, this.getPokemonById);

    // Admin routes - Pokemon CRUD
    this.router.post('/', isAuthenticated, isAdmin, validateDto(CreatePokemonDto), this.create);
    this.router.put('/:id', isAuthenticated, isAdmin, validateDto(UpdatePokemonDto), this.update);
    this.router.delete('/:id', isAuthenticated, isAdmin, this.delete);
  }

  /**
   * @swagger
   * /api/pokemon:
   *   get:
   *     tags:
   *       - Pokemon
   *     summary: Get all Pokemon
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *         description: Whether to include full Pokemon details
   *     responses:
   *       200:
   *         description: List of Pokemon
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Pokemon'
   *       401:
   *         description: Unauthorized
   */
  getAllPokemon = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 25;

    if (page < 1 || pageSize < 1) {
      throw new ValidationError('Page and pageSize must be greater than 0');
    }

    const pagination: PaginationOptions = {
      page,
      pageSize,
    };

    let result;
    if (Object.keys(req.body).length > 0) {
      // If there's a search body, use the search method
      const searchDto = plainToInstance(PokemonSearchDto, req.body);
      result = await this.pokemonService.search(searchDto, pagination);
    } else if (req.query.full === 'true') {
      result = await this.pokemonService.findAllFull(undefined, pagination);
    } else {
      result = await this.pokemonService.findAllBasic(undefined, pagination);
    }

    const group = req.query.full === 'true' ? this.getFullTransformGroup() : undefined;

    if ('data' in result) {
      // Paginated response
      res.json({
        ...result,
        data: plainToInstance(PokemonDto, result.data, {
          excludeExtraneousValues: true,
          groups: group,
        }),
      });
    } else {
      // Non-paginated response (fallback)
      res.json(
        plainToInstance(PokemonDto, result, {
          excludeExtraneousValues: true,
          groups: group,
        })
      );
    }
  });

  /**
   * @swagger
   * /api/pokemon/{id}:
   *   get:
   *     tags:
   *       - Pokemon
   *     summary: Get a Pokemon by ID
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Pokemon ID
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *         description: Whether to include full Pokemon details
   *     responses:
   *       200:
   *         description: Pokemon details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Pokemon'
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Pokemon not found
   *       400:
   *         description: Invalid Pokemon ID format
   */
  getPokemonById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError('Invalid Pokemon ID format');
    }

    let pokemon: Pokemon;

    if (req.query.full === 'true') {
      pokemon = await this.pokemonService.findOneFull(id);
    } else {
      pokemon = await this.pokemonService.findOneBasic(id);
    }

    const group = req.query.full === 'true' ? this.getFullTransformGroup() : undefined;

    res.json(
      plainToInstance(PokemonDto, pokemon, {
        excludeExtraneousValues: true,
        groups: group,
      })
    );
  });

  /**
   * @swagger
   * /api/pokemon:
   *   post:
   *     tags:
   *       - Pokemon
   *     summary: Create a new Pokemon (Admin only)
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - dexId
   *               - name
   *               - hp
   *               - attack
   *               - defense
   *               - specialAttack
   *               - specialDefense
   *               - speed
   *               - baseStatTotal
   *               - height
   *               - weight
   *             properties:
   *               dexId:
   *                 type: integer
   *               name:
   *                 type: string
   *               hp:
   *                 type: integer
   *               attack:
   *                 type: integer
   *               defense:
   *                 type: integer
   *               specialAttack:
   *                 type: integer
   *               specialDefense:
   *                 type: integer
   *               speed:
   *                 type: integer
   *               baseStatTotal:
   *                 type: integer
   *               height:
   *                 type: number
   *               weight:
   *                 type: number
   *               types:
   *                 type: array
   *                 items:
   *                   $ref: '#/components/schemas/PokemonType'
   *     responses:
   *       201:
   *         description: Pokemon created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Pokemon'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Admin access required
   *       400:
   *         description: Invalid input
   */
  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // ... existing implementation ...
  });

  /**
   * @swagger
   * /api/pokemon/{id}:
   *   put:
   *     tags:
   *       - Pokemon
   *     summary: Update a Pokemon (Admin only)
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Pokemon ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               dexId:
   *                 type: integer
   *               name:
   *                 type: string
   *               hp:
   *                 type: integer
   *               attack:
   *                 type: integer
   *               defense:
   *                 type: integer
   *               specialAttack:
   *                 type: integer
   *               specialDefense:
   *                 type: integer
   *               speed:
   *                 type: integer
   *               baseStatTotal:
   *                 type: integer
   *               height:
   *                 type: number
   *               weight:
   *                 type: number
   *               types:
   *                 type: array
   *                 items:
   *                   $ref: '#/components/schemas/PokemonType'
   *     responses:
   *       200:
   *         description: Pokemon updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Pokemon'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Admin access required
   *       404:
   *         description: Pokemon not found
   *       400:
   *         description: Invalid input
   */
  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // ... existing implementation ...
  });

  /**
   * @swagger
   * /api/pokemon/{id}:
   *   delete:
   *     tags:
   *       - Pokemon
   *     summary: Delete a Pokemon (Admin only)
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Pokemon ID
   *     responses:
   *       204:
   *         description: Pokemon deleted successfully
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Admin access required
   *       404:
   *         description: Pokemon not found
   *       400:
   *         description: Invalid Pokemon ID format
   */
  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // ... existing implementation ...
  });

  protected getFullTransformGroup(): string[] {
    return ['pokemon.full', 'pokemonMove.full'];
  }
}
