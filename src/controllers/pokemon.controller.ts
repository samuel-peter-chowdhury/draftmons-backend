import { Request, Response, Router } from 'express';
import { PokemonService } from '../services/pokemon.service';
import { BaseController } from './base.controller';
import { Pokemon } from '../entities/pokemon.entity';
import { validateDto, validatePartialDto } from '../middleware/validation.middleware';
import { PokemonInputDto, PokemonOutputDto } from '../dtos/pokemon.dto';
import { FindOptionsWhere, FindOptionsRelations } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { asyncHandler } from '../utils/error.utils';
import { Container } from 'typedi';

export class PokemonController extends BaseController<Pokemon, PokemonInputDto, PokemonOutputDto> {
  public router = Router();

  constructor(private pokemonService: PokemonService) {
    super(pokemonService, PokemonOutputDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', this.getAll);
    this.router.get('/:id', this.getById);
    this.router.post('/', validateDto(PokemonInputDto), this.create);
    this.router.put('/:id', validatePartialDto(PokemonInputDto), this.update);
    this.router.delete('/:id', this.delete);
  }

  getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const isFull = req.query.full === 'true';
    const group = isFull ? this.getFullTransformGroup() : undefined;

    // Get pagination and sort options
    const paginationOptions = await this.getPaginationOptions(req);
    const sortOptions = await this.getSortOptions(req);

    // Check if advanced filters are present
    const hasAdvancedFilters = this.hasAdvancedFilters(req);

    if (!hasAdvancedFilters) {
      // Use base service for simple queries
      const where = await this.getWhere(req);
      const relations = isFull ? this.getFullRelations() : this.getBaseRelations();
      const entities = await this.pokemonService.findAll(where, relations, paginationOptions, sortOptions);

      res.json(
        plainToInstance(this.outputDtoClass, entities, {
          groups: group,
        }),
      );
      return;
    }

    // Build query with advanced filters using QueryBuilder
    const repository = Container.get<any>('PokemonRepository');
    let query = repository.createQueryBuilder('pokemon');

    // Load base relations
    const relations = isFull ? this.getFullRelations() : this.getBaseRelations();
    if (relations) {
      if (relations.pokemonTypes) {
        query = query.leftJoinAndSelect('pokemon.pokemonTypes', 'pokemonTypes');
      }
      if (relations.abilities) {
        query = query.leftJoinAndSelect('pokemon.abilities', 'abilities');
      }
      if (isFull && relations.pokemonMoves) {
        query = query.leftJoinAndSelect('pokemon.pokemonMoves', 'pokemonMoves');
      }
      if (isFull && relations.typeEffectiveness) {
        query = query.leftJoinAndSelect('pokemon.typeEffectiveness', 'typeEffectiveness');
      }
      if (isFull && relations.seasonPokemon) {
        query = query.leftJoinAndSelect('pokemon.seasonPokemon', 'seasonPokemon');
      }
      if (isFull && relations.generations) {
        query = query.leftJoinAndSelect('pokemon.generations', 'generations');
      }
    }

    // Apply filters
    query = this.applyAdvancedFilters(query, req);

    // Apply sorting
    if (sortOptions) {
      query = query.orderBy(`pokemon.${sortOptions.sortBy}`, sortOptions.sortOrder as 'ASC' | 'DESC');
    }

    // Apply pagination
    if (paginationOptions) {
      const { page, pageSize } = paginationOptions;
      const skip = (page - 1) * pageSize;
      query = query.skip(skip).take(pageSize);

      const [data, total] = await query.getManyAndCount();

      const response = {
        data: plainToInstance(this.outputDtoClass, data, { groups: group }),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };

      res.json(response);
    } else {
      const data = await query.getMany();
      res.json(plainToInstance(this.outputDtoClass, data, { groups: group }));
    }
  });

  private hasAdvancedFilters(req: Request): boolean {
    const advancedParams = [
      'nameLike',
      'minHp', 'maxHp',
      'minAttack', 'maxAttack',
      'minDefense', 'maxDefense',
      'minSpecialAttack', 'maxSpecialAttack',
      'minSpecialDefense', 'maxSpecialDefense',
      'minSpeed', 'maxSpeed',
      'minBaseStatTotal', 'maxBaseStatTotal',
      'minPhysicalBulk', 'maxPhysicalBulk',
      'minSpecialBulk', 'maxSpecialBulk',
      'pokemonTypeIds',
      'abilityIds',
    ];

    return advancedParams.some((param) => req.query[param] !== undefined);
  }

  private applyAdvancedFilters(query: any, req: Request): any {
    // Name ILIKE filter
    if (req.query.nameLike) {
      query = query.andWhere('pokemon.name ILIKE :nameLike', {
        nameLike: `%${req.query.nameLike}%`,
      });
    }

    // Stat range filters - map camelCase to snake_case for database columns
    const statFieldsMap: { [key: string]: string } = {
      hp: 'hp',
      attack: 'attack',
      defense: 'defense',
      specialAttack: 'special_attack',
      specialDefense: 'special_defense',
      speed: 'speed',
      baseStatTotal: 'base_stat_total',
    };

    for (const [field, dbColumn] of Object.entries(statFieldsMap)) {
      const minParam = `min${field.charAt(0).toUpperCase() + field.slice(1)}`;
      const maxParam = `max${field.charAt(0).toUpperCase() + field.slice(1)}`;

      if (req.query[minParam]) {
        const minValue = parseInt(req.query[minParam] as string);
        if (!isNaN(minValue)) {
          query = query.andWhere(`pokemon.${dbColumn} >= :${minParam}`, {
            [minParam]: minValue,
          });
        }
      }

      if (req.query[maxParam]) {
        const maxValue = parseInt(req.query[maxParam] as string);
        if (!isNaN(maxValue)) {
          query = query.andWhere(`pokemon.${dbColumn} <= :${maxParam}`, {
            [maxParam]: maxValue,
          });
        }
      }
    }

    // Physical bulk filter (hp + defense)
    if (req.query.minPhysicalBulk) {
      const minPhysicalBulk = parseInt(req.query.minPhysicalBulk as string);
      if (!isNaN(minPhysicalBulk)) {
        query = query.andWhere('(pokemon.hp + pokemon.defense) >= :minPhysicalBulk', {
          minPhysicalBulk,
        });
      }
    }

    if (req.query.maxPhysicalBulk) {
      const maxPhysicalBulk = parseInt(req.query.maxPhysicalBulk as string);
      if (!isNaN(maxPhysicalBulk)) {
        query = query.andWhere('(pokemon.hp + pokemon.defense) <= :maxPhysicalBulk', {
          maxPhysicalBulk,
        });
      }
    }

    // Special bulk filter (hp + specialDefense)
    if (req.query.minSpecialBulk) {
      const minSpecialBulk = parseInt(req.query.minSpecialBulk as string);
      if (!isNaN(minSpecialBulk)) {
        query = query.andWhere('(pokemon.hp + pokemon.special_defense) >= :minSpecialBulk', {
          minSpecialBulk,
        });
      }
    }

    if (req.query.maxSpecialBulk) {
      const maxSpecialBulk = parseInt(req.query.maxSpecialBulk as string);
      if (!isNaN(maxSpecialBulk)) {
        query = query.andWhere('(pokemon.hp + pokemon.special_defense) <= :maxSpecialBulk', {
          maxSpecialBulk,
        });
      }
    }

    // Pokemon type IDs filter (must have ALL specified types)
    if (req.query.pokemonTypeIds) {
      let typeIds = req.query.pokemonTypeIds;
      if (!Array.isArray(typeIds)) {
        typeIds = [typeIds];
      }
      const typeIdNumbers = (typeIds as string[]).map(id => parseInt(id)).filter(id => !isNaN(id));

      if (typeIdNumbers.length > 0) {
        // For each type ID, add a subquery to ensure the pokemon has that type
        for (let i = 0; i < typeIdNumbers.length; i++) {
          query = query.andWhere(
            `EXISTS (
              SELECT 1 FROM pokemon_pokemon_types ppt
              WHERE ppt.pokemon_id = pokemon.id
              AND ppt.pokemon_type_id = :typeId${i}
            )`,
            { [`typeId${i}`]: typeIdNumbers[i] }
          );
        }
      }
    }

    // Ability IDs filter (must have ALL specified abilities)
    if (req.query.abilityIds) {
      let abilityIds = req.query.abilityIds;
      if (!Array.isArray(abilityIds)) {
        abilityIds = [abilityIds];
      }
      const abilityIdNumbers = (abilityIds as string[]).map(id => parseInt(id)).filter(id => !isNaN(id));

      if (abilityIdNumbers.length > 0) {
        // For each ability ID, add a subquery to ensure the pokemon has that ability
        for (let i = 0; i < abilityIdNumbers.length; i++) {
          query = query.andWhere(
            `EXISTS (
              SELECT 1 FROM pokemon_abilities pa
              WHERE pa.pokemon_id = pokemon.id
              AND pa.ability_id = :abilityId${i}
            )`,
            { [`abilityId${i}`]: abilityIdNumbers[i] }
          );
        }
      }
    }

    return query;
  }

  protected getFullTransformGroup(): string[] {
    return ['pokemon.full'];
  }

  protected async getWhere(
    req: Request,
  ): Promise<FindOptionsWhere<Pokemon> | FindOptionsWhere<Pokemon>[] | undefined> {
    return plainToInstance(PokemonInputDto, req.query, { excludeExtraneousValues: true });
  }

  protected getBaseRelations(): FindOptionsRelations<Pokemon> | undefined {
    return {
      pokemonTypes: true,
      abilities: true,
    };
  }

  protected getFullRelations(): FindOptionsRelations<Pokemon> | undefined {
    return undefined;
  }

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
   *       required:
   *         - id
   *         - dexId
   *         - name
   *         - hp
   *         - attack
   *         - defense
   *         - specialAttack
   *         - specialDefense
   *         - speed
   *         - baseStatTotal
   *         - height
   *         - weight
   *         - sprite
   *         - isActive
   *         - createdAt
   *         - updatedAt
   *       properties:
   *         id:
   *           type: integer
   *           description: Unique identifier of the Pokemon
   *           example: 1
   *         dexId:
   *           type: integer
   *           description: National Pokedex number
   *           example: 25
   *         name:
   *           type: string
   *           description: Name of the Pokemon
   *           example: "Pikachu"
   *         hp:
   *           type: integer
   *           description: Base HP stat
   *           example: 35
   *         attack:
   *           type: integer
   *           description: Base Attack stat
   *           example: 55
   *         defense:
   *           type: integer
   *           description: Base Defense stat
   *           example: 40
   *         specialAttack:
   *           type: integer
   *           description: Base Special Attack stat
   *           example: 50
   *         specialDefense:
   *           type: integer
   *           description: Base Special Defense stat
   *           example: 50
   *         speed:
   *           type: integer
   *           description: Base Speed stat
   *           example: 90
   *         baseStatTotal:
   *           type: integer
   *           description: Sum of all base stats
   *           example: 320
   *         height:
   *           type: number
   *           format: float
   *           description: Height in meters
   *           example: 0.4
   *         weight:
   *           type: number
   *           format: float
   *           description: Weight in kilograms
   *           example: 6.0
   *         sprite:
   *           type: string
   *           description: URL to the Pokemon's sprite image
   *           example: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"
   *         isActive:
   *           type: boolean
   *           description: Whether the Pokemon is currently active
   *           example: true
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the Pokemon was created
   *           example: "2024-01-01T00:00:00.000Z"
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the Pokemon was last updated
   *           example: "2024-01-15T12:30:00.000Z"
   *
   *     PokemonFull:
   *       allOf:
   *         - $ref: '#/components/schemas/Pokemon'
   *         - type: object
   *           properties:
   *             pokemonTypes:
   *               type: array
   *               description: Types of this Pokemon
   *               items:
   *                 $ref: '#/components/schemas/PokemonType'
   *             pokemonMoves:
   *               type: array
   *               description: Moves this Pokemon can learn
   *               items:
   *                 $ref: '#/components/schemas/PokemonMove'
   *             abilities:
   *               type: array
   *               description: Abilities this Pokemon can have
   *               items:
   *                 $ref: '#/components/schemas/Ability'
   *             typeEffectiveness:
   *               type: array
   *               description: Type effectiveness for this Pokemon
   *               items:
   *                 $ref: '#/components/schemas/TypeEffective'
   *             seasonPokemon:
   *               type: array
   *               description: Season entries for this Pokemon
   *               items:
   *                 $ref: '#/components/schemas/SeasonPokemon'
   *             generations:
   *               type: array
   *               description: Generations this Pokemon appears in
   *               items:
   *                 $ref: '#/components/schemas/Generation'
   *
   *     PokemonInput:
   *       type: object
   *       required:
   *         - dexId
   *         - name
   *         - hp
   *         - attack
   *         - defense
   *         - specialAttack
   *         - specialDefense
   *         - speed
   *         - baseStatTotal
   *         - height
   *         - weight
   *         - sprite
   *       properties:
   *         dexId:
   *           type: integer
   *           description: National Pokedex number
   *           example: 25
   *           minimum: 1
   *           maximum: 1025
   *         name:
   *           type: string
   *           description: Name of the Pokemon
   *           example: "Pikachu"
   *           minLength: 1
   *           maxLength: 100
   *         hp:
   *           type: integer
   *           description: Base HP stat
   *           example: 35
   *           minimum: 1
   *           maximum: 255
   *         attack:
   *           type: integer
   *           description: Base Attack stat
   *           example: 55
   *           minimum: 1
   *           maximum: 255
   *         defense:
   *           type: integer
   *           description: Base Defense stat
   *           example: 40
   *           minimum: 1
   *           maximum: 255
   *         specialAttack:
   *           type: integer
   *           description: Base Special Attack stat
   *           example: 50
   *           minimum: 1
   *           maximum: 255
   *         specialDefense:
   *           type: integer
   *           description: Base Special Defense stat
   *           example: 50
   *           minimum: 1
   *           maximum: 255
   *         speed:
   *           type: integer
   *           description: Base Speed stat
   *           example: 90
   *           minimum: 1
   *           maximum: 255
   *         baseStatTotal:
   *           type: integer
   *           description: Sum of all base stats
   *           example: 320
   *           minimum: 6
   *           maximum: 1530
   *         height:
   *           type: number
   *           format: float
   *           description: Height in meters
   *           example: 0.4
   *           minimum: 0.1
   *           maximum: 100
   *         weight:
   *           type: number
   *           format: float
   *           description: Weight in kilograms
   *           example: 6.0
   *           minimum: 0.1
   *           maximum: 9999
   *         sprite:
   *           type: string
   *           description: URL to the Pokemon's sprite image
   *           example: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"
   *           maxLength: 500
   *
   *     PokemonUpdateInput:
   *       type: object
   *       properties:
   *         dexId:
   *           type: integer
   *           description: National Pokedex number
   *           example: 25
   *           minimum: 1
   *           maximum: 1025
   *         name:
   *           type: string
   *           description: Name of the Pokemon
   *           example: "Pikachu"
   *           minLength: 1
   *           maxLength: 100
   *         hp:
   *           type: integer
   *           description: Base HP stat
   *           example: 35
   *           minimum: 1
   *           maximum: 255
   *         attack:
   *           type: integer
   *           description: Base Attack stat
   *           example: 55
   *           minimum: 1
   *           maximum: 255
   *         defense:
   *           type: integer
   *           description: Base Defense stat
   *           example: 40
   *           minimum: 1
   *           maximum: 255
   *         specialAttack:
   *           type: integer
   *           description: Base Special Attack stat
   *           example: 50
   *           minimum: 1
   *           maximum: 255
   *         specialDefense:
   *           type: integer
   *           description: Base Special Defense stat
   *           example: 50
   *           minimum: 1
   *           maximum: 255
   *         speed:
   *           type: integer
   *           description: Base Speed stat
   *           example: 90
   *           minimum: 1
   *           maximum: 255
   *         baseStatTotal:
   *           type: integer
   *           description: Sum of all base stats
   *           example: 320
   *           minimum: 6
   *           maximum: 1530
   *         height:
   *           type: number
   *           format: float
   *           description: Height in meters
   *           example: 0.4
   *           minimum: 0.1
   *           maximum: 100
   *         weight:
   *           type: number
   *           format: float
   *           description: Weight in kilograms
   *           example: 6.0
   *           minimum: 0.1
   *           maximum: 9999
   *         sprite:
   *           type: string
   *           description: URL to the Pokemon's sprite image
   *           example: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"
   *           maxLength: 500
   */

  /**
   * @swagger
   * /api/pokemon:
   *   get:
   *     tags:
   *       - Pokemon
   *     summary: Get all Pokemon with advanced filtering
   *     description: |
   *       Retrieve a list of all Pokemon with optional pagination, sorting, advanced filtering, and full details.
   *       Supports filtering by name pattern, stat ranges, calculated bulk stats, and type/ability requirements.
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
   *         description: Field name to sort by (e.g., name, dexId, baseStatTotal)
   *         example: dexId
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
   *         description: Include full Pokemon details (types, moves, abilities, etc.)
   *       - in: query
   *         name: nameLike
   *         schema:
   *           type: string
   *         description: Filter Pokemon by name (case-insensitive partial match)
   *         example: char
   *       - in: query
   *         name: minHp
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Minimum HP stat
   *         example: 50
   *       - in: query
   *         name: maxHp
   *         schema:
   *           type: integer
   *           maximum: 255
   *         description: Maximum HP stat
   *         example: 100
   *       - in: query
   *         name: minAttack
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Minimum Attack stat
   *         example: 80
   *       - in: query
   *         name: maxAttack
   *         schema:
   *           type: integer
   *           maximum: 255
   *         description: Maximum Attack stat
   *         example: 150
   *       - in: query
   *         name: minDefense
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Minimum Defense stat
   *         example: 60
   *       - in: query
   *         name: maxDefense
   *         schema:
   *           type: integer
   *           maximum: 255
   *         description: Maximum Defense stat
   *         example: 120
   *       - in: query
   *         name: minSpecialAttack
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Minimum Special Attack stat
   *         example: 70
   *       - in: query
   *         name: maxSpecialAttack
   *         schema:
   *           type: integer
   *           maximum: 255
   *         description: Maximum Special Attack stat
   *         example: 140
   *       - in: query
   *         name: minSpecialDefense
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Minimum Special Defense stat
   *         example: 70
   *       - in: query
   *         name: maxSpecialDefense
   *         schema:
   *           type: integer
   *           maximum: 255
   *         description: Maximum Special Defense stat
   *         example: 130
   *       - in: query
   *         name: minSpeed
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Minimum Speed stat
   *         example: 90
   *       - in: query
   *         name: maxSpeed
   *         schema:
   *           type: integer
   *           maximum: 255
   *         description: Maximum Speed stat
   *         example: 150
   *       - in: query
   *         name: minBaseStatTotal
   *         schema:
   *           type: integer
   *           minimum: 6
   *         description: Minimum base stat total (sum of all stats)
   *         example: 500
   *       - in: query
   *         name: maxBaseStatTotal
   *         schema:
   *           type: integer
   *           maximum: 1530
   *         description: Maximum base stat total (sum of all stats)
   *         example: 600
   *       - in: query
   *         name: minPhysicalBulk
   *         schema:
   *           type: integer
   *           minimum: 2
   *         description: Minimum physical bulk (HP + Defense)
   *         example: 150
   *       - in: query
   *         name: maxPhysicalBulk
   *         schema:
   *           type: integer
   *           maximum: 510
   *         description: Maximum physical bulk (HP + Defense)
   *         example: 200
   *       - in: query
   *         name: minSpecialBulk
   *         schema:
   *           type: integer
   *           minimum: 2
   *         description: Minimum special bulk (HP + Special Defense)
   *         example: 150
   *       - in: query
   *         name: maxSpecialBulk
   *         schema:
   *           type: integer
   *           maximum: 510
   *         description: Maximum special bulk (HP + Special Defense)
   *         example: 200
   *       - in: query
   *         name: pokemonTypeIds
   *         schema:
   *           type: array
   *           items:
   *             type: integer
   *         style: form
   *         explode: true
   *         description: Filter Pokemon that have ALL specified type IDs (array of integers)
   *         example: [10, 2]
   *       - in: query
   *         name: abilityIds
   *         schema:
   *           type: array
   *           items:
   *             type: integer
   *         style: form
   *         explode: true
   *         description: Filter Pokemon that have ALL specified ability IDs (array of integers)
   *         example: [1, 5]
   *     responses:
   *       200:
   *         description: List of Pokemon retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 oneOf:
   *                   - $ref: '#/components/schemas/Pokemon'
   *                   - $ref: '#/components/schemas/PokemonFull'
   *             examples:
   *               basic:
   *                 summary: Basic Pokemon list
   *                 value:
   *                   - id: 1
   *                     dexId: 25
   *                     name: "Pikachu"
   *                     hp: 35
   *                     attack: 55
   *                     defense: 40
   *                     specialAttack: 50
   *                     specialDefense: 50
   *                     speed: 90
   *                     baseStatTotal: 320
   *                     height: 0.4
   *                     weight: 6.0
   *                     sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 2
   *                     dexId: 6
   *                     name: "Charizard"
   *                     hp: 78
   *                     attack: 84
   *                     defense: 78
   *                     specialAttack: 109
   *                     specialDefense: 85
   *                     speed: 100
   *                     baseStatTotal: 534
   *                     height: 1.7
   *                     weight: 90.5
   *                     sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *               highSpeed:
   *                 summary: Filter by speed (minSpeed=100)
   *                 description: Get all Pokemon with speed >= 100
   *                 value:
   *                   - id: 2
   *                     dexId: 6
   *                     name: "Charizard"
   *                     hp: 78
   *                     attack: 84
   *                     defense: 78
   *                     specialAttack: 109
   *                     specialDefense: 85
   *                     speed: 100
   *                     baseStatTotal: 534
   *                     height: 1.7
   *                     weight: 90.5
   *                     sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *               legendaries:
   *                 summary: Filter by base stat total (minBaseStatTotal=600)
   *                 description: Get all legendary/pseudo-legendary Pokemon
   *                 value:
   *                   - id: 3
   *                     dexId: 149
   *                     name: "Dragonite"
   *                     hp: 91
   *                     attack: 134
   *                     defense: 95
   *                     specialAttack: 100
   *                     specialDefense: 100
   *                     speed: 80
   *                     baseStatTotal: 600
   *                     height: 2.2
   *                     weight: 210.0
   *                     sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/149.png"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *               physicalTanks:
   *                 summary: Filter by physical bulk (minPhysicalBulk=170)
   *                 description: Get all Pokemon with high physical bulk (HP + Defense >= 170)
   *                 value:
   *                   - id: 4
   *                     dexId: 143
   *                     name: "Snorlax"
   *                     hp: 160
   *                     attack: 110
   *                     defense: 65
   *                     specialAttack: 65
   *                     specialDefense: 110
   *                     speed: 30
   *                     baseStatTotal: 540
   *                     height: 2.1
   *                     weight: 460.0
   *                     sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/143.png"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *               nameSearch:
   *                 summary: Search by name (nameLike=char)
   *                 description: Find all Pokemon whose name contains "char" (case-insensitive)
   *                 value:
   *                   - id: 2
   *                     dexId: 6
   *                     name: "Charizard"
   *                     hp: 78
   *                     attack: 84
   *                     defense: 78
   *                     specialAttack: 109
   *                     specialDefense: 85
   *                     speed: 100
   *                     baseStatTotal: 534
   *                     height: 1.7
   *                     weight: 90.5
   *                     sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *       400:
   *         description: Invalid query parameters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Invalid filter values"
   *               statusCode: 400
   *               timestamp: "2024-01-20T10:00:00.000Z"
   */

  /**
   * @swagger
   * /api/pokemon/{id}:
   *   get:
   *     tags:
   *       - Pokemon
   *     summary: Get a Pokemon by ID
   *     description: Retrieve detailed information about a specific Pokemon
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the Pokemon
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full Pokemon details (types, moves, abilities, etc.)
   *     responses:
   *       200:
   *         description: Pokemon details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/Pokemon'
   *                 - $ref: '#/components/schemas/PokemonFull'
   *             examples:
   *               basic:
   *                 summary: Basic Pokemon details
   *                 value:
   *                   id: 1
   *                   dexId: 25
   *                   name: "Pikachu"
   *                   hp: 35
   *                   attack: 55
   *                   defense: 40
   *                   specialAttack: 50
   *                   specialDefense: 50
   *                   speed: 90
   *                   baseStatTotal: 320
   *                   height: 0.4
   *                   weight: 6.0
   *                   sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *               full:
   *                 summary: Full Pokemon details with relations
   *                 value:
   *                   id: 1
   *                   dexId: 25
   *                   name: "Pikachu"
   *                   hp: 35
   *                   attack: 55
   *                   defense: 40
   *                   specialAttack: 50
   *                   specialDefense: 50
   *                   speed: 90
   *                   baseStatTotal: 320
   *                   height: 0.4
   *                   weight: 6.0
   *                   sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *                   pokemonTypes: []
   *                   pokemonMoves: []
   *                   abilities: []
   *                   typeEffectiveness: []
   *                   seasonPokemon: []
   *                   generations: []
   *       400:
   *         description: Invalid Pokemon ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Pokemon not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/pokemon:
   *   post:
   *     tags:
   *       - Pokemon
   *     summary: Create a new Pokemon
   *     description: Create a new Pokemon with all its base stats and information
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/PokemonInput'
   *           examples:
   *             starter:
   *               summary: Create a starter Pokemon
   *               value:
   *                 dexId: 1
   *                 name: "Bulbasaur"
   *                 hp: 45
   *                 attack: 49
   *                 defense: 49
   *                 specialAttack: 65
   *                 specialDefense: 65
   *                 speed: 45
   *                 baseStatTotal: 318
   *                 height: 0.7
   *                 weight: 6.9
   *                 sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png"
   *             legendary:
   *               summary: Create a legendary Pokemon
   *               value:
   *                 dexId: 150
   *                 name: "Mewtwo"
   *                 hp: 106
   *                 attack: 110
   *                 defense: 90
   *                 specialAttack: 154
   *                 specialDefense: 90
   *                 speed: 130
   *                 baseStatTotal: 680
   *                 height: 2.0
   *                 weight: 122.0
   *                 sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png"
   *             pseudo:
   *               summary: Create a pseudo-legendary Pokemon
   *               value:
   *                 dexId: 149
   *                 name: "Dragonite"
   *                 hp: 91
   *                 attack: 134
   *                 defense: 95
   *                 specialAttack: 100
   *                 specialDefense: 100
   *                 speed: 80
   *                 baseStatTotal: 600
   *                 height: 2.2
   *                 weight: 210.0
   *                 sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/149.png"
   *     responses:
   *       201:
   *         description: Pokemon created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Pokemon'
   *             example:
   *               id: 3
   *               dexId: 1
   *               name: "Bulbasaur"
   *               hp: 45
   *               attack: 49
   *               defense: 49
   *               specialAttack: 65
   *               specialDefense: 65
   *               speed: 45
   *               baseStatTotal: 318
   *               height: 0.7
   *               weight: 6.9
   *               sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png"
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
   *               error: "name: must be a string; hp: must be between 1 and 255"
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
   * /api/pokemon/{id}:
   *   put:
   *     tags:
   *       - Pokemon
   *     summary: Update a Pokemon
   *     description: Update an existing Pokemon. All fields are optional for partial updates.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the Pokemon
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full Pokemon details in the response (types, moves, abilities, etc.)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/PokemonUpdateInput'
   *           examples:
   *             updateStats:
   *               summary: Update base stats
   *               value:
   *                 hp: 40
   *                 attack: 60
   *                 defense: 45
   *                 baseStatTotal: 330
   *             updatePhysical:
   *               summary: Update physical attributes
   *               value:
   *                 height: 0.5
   *                 weight: 7.0
   *             updateSprite:
   *               summary: Update sprite URL
   *               value:
   *                 sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/25.png"
   *             updateMultiple:
   *               summary: Update multiple fields
   *               value:
   *                 name: "Raichu"
   *                 dexId: 26
   *                 speed: 110
   *                 baseStatTotal: 485
   *     responses:
   *       200:
   *         description: Pokemon updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/Pokemon'
   *                 - $ref: '#/components/schemas/PokemonFull'
   *             example:
   *               id: 1
   *               dexId: 25
   *               name: "Pikachu"
   *               hp: 40
   *               attack: 60
   *               defense: 45
   *               specialAttack: 50
   *               specialDefense: 50
   *               speed: 90
   *               baseStatTotal: 335
   *               height: 0.4
   *               weight: 6.0
   *               sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"
   *               isActive: true
   *               createdAt: "2024-01-01T00:00:00.000Z"
   *               updatedAt: "2024-01-20T15:00:00.000Z"
   *       400:
   *         description: Invalid Pokemon ID format or invalid input data
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
   *         description: Pokemon not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/pokemon/{id}:
   *   delete:
   *     tags:
   *       - Pokemon
   *     summary: Delete a Pokemon
   *     description: |
   *       Permanently delete a Pokemon.
   *       This action cannot be undone.
   *       Note: This will also remove all associated relationships (moves, abilities, types, etc.).
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the Pokemon to delete
   *         example: 1
   *     responses:
   *       204:
   *         description: Pokemon deleted successfully (no content returned)
   *       400:
   *         description: Invalid Pokemon ID format
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
   *         description: Pokemon not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Pokemon not found"
   *               statusCode: 404
   *               timestamp: "2024-01-20T16:00:00.000Z"
   */
}
