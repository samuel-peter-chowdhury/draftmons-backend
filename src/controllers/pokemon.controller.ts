import { Request, Response, Router } from 'express';
import { PokemonService } from '../services/pokemon.service';
import { BaseController } from './base.controller';
import { Pokemon } from '../entities/pokemon.entity';
import {
  PokemonDto,
  PokemonSearchDto,
} from '../dtos/pokemon.dto';
import { isAuthenticated } from '../middleware/auth.middleware';
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
  }

  /**
   * @swagger
   * /api/pokemon:
   *   get:
   *     tags:
   *       - Pokemon
   *     summary: Get all Pokemon with optional search and pagination
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Page number for pagination
   *       - in: query
   *         name: pageSize
   *         schema:
   *           type: integer
   *           default: 25
   *         description: Number of items per page
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *         description: Whether to include full Pokemon details
   *       - in: query
   *         name: generationId
   *         schema:
   *           type: integer
   *         description: Filter by generation ID
   *       - in: query
   *         name: name
   *         schema:
   *           type: string
   *         description: Filter by Pokemon name (partial match)
   *       - in: query
   *         name: dexId
   *         schema:
   *           type: integer
   *         description: Filter by Pokedex ID
   *       - in: query
   *         name: pokemonTypeId
   *         schema:
   *           type: integer
   *         description: Filter by Pokemon type ID
   *       - in: query
   *         name: pokemonMoveId
   *         schema:
   *           type: integer
   *         description: Filter by Pokemon move ID
   *       - in: query
   *         name: abilityId
   *         schema:
   *           type: integer
   *         description: Filter by ability ID
   *       - in: query
   *         name: seasonId
   *         schema:
   *           type: integer
   *         description: Filter by season ID
   *       - in: query
   *         name: weight
   *         schema:
   *           type: number
   *         description: Filter by exact weight
   *       - in: query
   *         name: height
   *         schema:
   *           type: number
   *         description: Filter by exact height
   *       - in: query
   *         name: minHp
   *         schema:
   *           type: integer
   *         description: Minimum HP value
   *       - in: query
   *         name: maxHp
   *         schema:
   *           type: integer
   *         description: Maximum HP value
   *       - in: query
   *         name: minAttack
   *         schema:
   *           type: integer
   *         description: Minimum attack value
   *       - in: query
   *         name: maxAttack
   *         schema:
   *           type: integer
   *         description: Maximum attack value
   *       - in: query
   *         name: minDefense
   *         schema:
   *           type: integer
   *         description: Minimum defense value
   *       - in: query
   *         name: maxDefense
   *         schema:
   *           type: integer
   *         description: Maximum defense value
   *       - in: query
   *         name: minSpecialAttack
   *         schema:
   *           type: integer
   *         description: Minimum special attack value
   *       - in: query
   *         name: maxSpecialAttack
   *         schema:
   *           type: integer
   *         description: Maximum special attack value
   *       - in: query
   *         name: minSpecialDefense
   *         schema:
   *           type: integer
   *         description: Minimum special defense value
   *       - in: query
   *         name: maxSpecialDefense
   *         schema:
   *           type: integer
   *         description: Maximum special defense value
   *       - in: query
   *         name: minSpeed
   *         schema:
   *           type: integer
   *         description: Minimum speed value
   *       - in: query
   *         name: maxSpeed
   *         schema:
   *           type: integer
   *         description: Maximum speed value
   *       - in: query
   *         name: minBaseStatTotal
   *         schema:
   *           type: integer
   *         description: Minimum base stat total
   *       - in: query
   *         name: maxBaseStatTotal
   *         schema:
   *           type: integer
   *         description: Maximum base stat total
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [dexId, name, hp, attack, defense, specialAttack, specialDefense, speed, baseStatTotal, height, weight]
   *         description: Field to sort by
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [ASC, DESC]
   *         description: Sort order (ASC or DESC)
   *     responses:
   *       200:
   *         description: List of Pokemon
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Pokemon'
   *                 total:
   *                   type: integer
   *                 page:
   *                   type: integer
   *                 pageSize:
   *                   type: integer
   *       401:
   *         description: Unauthorized
   *       400:
   *         description: Invalid pagination parameters
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
    if (Object.keys(req.query).length > 3) { // More than just page, pageSize, and full
      // Create search DTO from query parameters
      const searchDto = plainToInstance(PokemonSearchDto, {
        generationId: req.query.generationId ? parseInt(req.query.generationId as string) : undefined,
        name: req.query.name as string,
        dexId: req.query.dexId ? parseInt(req.query.dexId as string) : undefined,
        pokemonTypeId: req.query.pokemonTypeId ? parseInt(req.query.pokemonTypeId as string) : undefined,
        pokemonMoveId: req.query.pokemonMoveId ? parseInt(req.query.pokemonMoveId as string) : undefined,
        abilityId: req.query.abilityId ? parseInt(req.query.abilityId as string) : undefined,
        seasonId: req.query.seasonId ? parseInt(req.query.seasonId as string) : undefined,
        weight: req.query.weight ? parseFloat(req.query.weight as string) : undefined,
        height: req.query.height ? parseFloat(req.query.height as string) : undefined,
        minHp: req.query.minHp ? parseInt(req.query.minHp as string) : undefined,
        maxHp: req.query.maxHp ? parseInt(req.query.maxHp as string) : undefined,
        minAttack: req.query.minAttack ? parseInt(req.query.minAttack as string) : undefined,
        maxAttack: req.query.maxAttack ? parseInt(req.query.maxAttack as string) : undefined,
        minDefense: req.query.minDefense ? parseInt(req.query.minDefense as string) : undefined,
        maxDefense: req.query.maxDefense ? parseInt(req.query.maxDefense as string) : undefined,
        minSpecialAttack: req.query.minSpecialAttack ? parseInt(req.query.minSpecialAttack as string) : undefined,
        maxSpecialAttack: req.query.maxSpecialAttack ? parseInt(req.query.maxSpecialAttack as string) : undefined,
        minSpecialDefense: req.query.minSpecialDefense ? parseInt(req.query.minSpecialDefense as string) : undefined,
        maxSpecialDefense: req.query.maxSpecialDefense ? parseInt(req.query.maxSpecialDefense as string) : undefined,
        minSpeed: req.query.minSpeed ? parseInt(req.query.minSpeed as string) : undefined,
        maxSpeed: req.query.maxSpeed ? parseInt(req.query.maxSpeed as string) : undefined,
        minBaseStatTotal: req.query.minBaseStatTotal ? parseInt(req.query.minBaseStatTotal as string) : undefined,
        maxBaseStatTotal: req.query.maxBaseStatTotal ? parseInt(req.query.maxBaseStatTotal as string) : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'ASC' | 'DESC',
      });
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
   *       - in: query
   *         name: generationId
   *         schema:
   *           type: integer
   *         description: Filter by generation ID
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

    let generationWhere = {};
    if (req.query.generationId) {
      generationWhere = { generations: { id: req.query.generationId }, pokemonMoves: { generationId: req.query.generationId } };
    }

    if (req.query.full === 'true') {
      pokemon = await this.pokemonService.findOneFull(id, generationWhere);
    } else {
      pokemon = await this.pokemonService.findOneBasic(id, generationWhere);
    }

    const group = req.query.full === 'true' ? this.getFullTransformGroup() : undefined;

    res.json(
      plainToInstance(PokemonDto, pokemon, {
        excludeExtraneousValues: true,
        groups: group,
      })
    );
  });

  protected getFullTransformGroup(): string[] {
    return ['pokemon.full', 'pokemonMove.full'];
  }
}
