import { Request, Router } from 'express';
import { PokemonService } from '../services/pokemon.service';
import { BaseController } from './base.controller';
import { Pokemon } from '../entities/pokemon.entity';
import { validateDto, validatePartialDto } from '../middleware/validation.middleware';
import { PokemonInputDto, PokemonOutputDto } from '../dtos/pokemon.dto';
import { FindOptionsWhere, FindOptionsRelations } from 'typeorm';
import { plainToInstance } from 'class-transformer';

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

  protected getFullTransformGroup(): string[] {
    return ['pokemon.full'];
  }

  protected async getWhere(
    req: Request,
  ): Promise<FindOptionsWhere<Pokemon> | FindOptionsWhere<Pokemon>[] | undefined> {
    return plainToInstance(PokemonInputDto, req.query, { excludeExtraneousValues: true });
  }

  protected getBaseRelations(): FindOptionsRelations<Pokemon> | undefined {
    return undefined;
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
   *     summary: Get all Pokemon
   *     description: Retrieve a list of all Pokemon with optional pagination, sorting, and full details
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
   *               full:
   *                 summary: Full Pokemon details
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
   *                     pokemonTypes: []
   *                     pokemonMoves: []
   *                     abilities: []
   *                     typeEffectiveness: []
   *                     seasonPokemon: []
   *                     generations: []
   *       400:
   *         description: Invalid query parameters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
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
