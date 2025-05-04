import { Request, Response, Router } from 'express';
import { PokemonService } from '../services/pokemon.service';
import { BaseController } from './base.controller';
import { Pokemon } from '../entities/pokemon.entity';
import {
  PokemonDto,
  CreatePokemonDto,
  UpdatePokemonDto,
  PokemonTypeDto,
  PokemonAbilityDto,
  PokemonMoveDto,
  TypeEffectiveDto,
  CreatePokemonTypeDto
} from '../dtos/pokemon.dto';
import { validateDto } from '../middleware/validation.middleware';
import { isAuthenticated, isAdmin } from '../middleware/auth.middleware';
import { HttpException, asyncHandler } from '../utils/error.utils';
import { plainToInstance } from 'class-transformer';

export class PokemonController extends BaseController<Pokemon, PokemonDto, UpdatePokemonDto> {
  public router = Router();

  constructor(private pokemonService: PokemonService) {
    super(pokemonService, PokemonDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Public routes
    this.router.get('/', this.getAllPokemon);
    this.router.get('/:id', this.getPokemonById);

    // Admin routes - Pokemon CRUD
    this.router.post('/', isAuthenticated, isAdmin, validateDto(CreatePokemonDto), this.createPokemon);
    this.router.put('/:id', isAuthenticated, isAdmin, validateDto(UpdatePokemonDto), this.update);
    this.router.delete('/:id', isAuthenticated, isAdmin, this.delete);

    // Type routes
    this.router.post('/:id/types', isAuthenticated, isAdmin, validateDto(CreatePokemonTypeDto), this.addType);
    this.router.delete('/:id/types/:type', isAuthenticated, isAdmin, this.removeType);

    // Ability routes
    this.router.post('/:id/abilities/:abilityId', isAuthenticated, isAdmin, this.addAbility);
    this.router.delete('/:id/abilities/:abilityId', isAuthenticated, isAdmin, this.removeAbility);

    // Move routes
    this.router.post('/:id/moves/:moveId', isAuthenticated, isAdmin, this.addMove);
    this.router.delete('/:id/moves/:moveId', isAuthenticated, isAdmin, this.removeMove);

    // Type effectiveness routes
    this.router.post('/:id/effectiveness/:type/:value', isAuthenticated, isAdmin, this.setTypeEffectiveness);
  }

  // Pokemon methods
  getAllPokemon = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    let pokemon: Pokemon[];

    if (req.query.full === 'true') {
      pokemon = await this.pokemonService.findAllWithDetails();
    } else {
      pokemon = await this.pokemonService.findAll();
    }

    const group = req.query.full === 'true' ? this.getFullTransformGroup() : undefined;

    res.json(
      plainToInstance(PokemonDto, pokemon, {
        excludeExtraneousValues: true,
        groups: group,
      })
    );
  });

  getPokemonById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    let pokemon: Pokemon;

    if (req.query.full === 'true') {
      pokemon = await this.pokemonService.findOneWithDetails(id);
    } else {
      pokemon = await this.pokemonService.findOne(id);
    }

    const group = req.query.full === 'true' ? this.getFullTransformGroup() : undefined;

    res.json(
      plainToInstance(PokemonDto, pokemon, {
        excludeExtraneousValues: true,
        groups: group,
      })
    );
  });

  createPokemon = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pokemon = await this.pokemonService.createPokemon(req.body);

    res.status(201).json(
      plainToInstance(PokemonDto, pokemon, {
        excludeExtraneousValues: true,
        groups: this.getFullTransformGroup(),
      })
    );
  });

  // Type methods
  addType = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pokemonId = parseInt(req.params.id);
    const { type } = req.body;

    const pokemonType = await this.pokemonService.addType(pokemonId, type);

    res.status(201).json(
      plainToInstance(PokemonTypeDto, pokemonType, {
        excludeExtraneousValues: true,
      })
    );
  });

  removeType = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pokemonId = parseInt(req.params.id);
    const type = req.params.type;

    await this.pokemonService.removeType(pokemonId, type);

    res.status(204).send();
  });

  // Ability methods
  addAbility = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pokemonId = parseInt(req.params.id);
    const abilityId = parseInt(req.params.abilityId);

    const pokemonAbility = await this.pokemonService.addAbility(pokemonId, abilityId);

    res.status(201).json(
      plainToInstance(PokemonAbilityDto, pokemonAbility, {
        excludeExtraneousValues: true,
      })
    );
  });

  removeAbility = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pokemonId = parseInt(req.params.id);
    const abilityId = parseInt(req.params.abilityId);

    await this.pokemonService.removeAbility(pokemonId, abilityId);

    res.status(204).send();
  });

  // Move methods
  addMove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pokemonId = parseInt(req.params.id);
    const moveId = parseInt(req.params.moveId);
    const { gen } = req.body;

    if (!gen) {
      throw new HttpException(400, 'Generation (gen) is required');
    }

    const pokemonMove = await this.pokemonService.addMove(pokemonId, moveId, gen);

    res.status(201).json(
      plainToInstance(PokemonMoveDto, pokemonMove, {
        excludeExtraneousValues: true,
      })
    );
  });

  removeMove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pokemonId = parseInt(req.params.id);
    const moveId = parseInt(req.params.moveId);

    await this.pokemonService.removeMove(pokemonId, moveId);

    res.status(204).send();
  });

  // Type effectiveness methods
  setTypeEffectiveness = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pokemonId = parseInt(req.params.id);
    const type = req.params.type;
    const value = parseFloat(req.params.value);

    if (isNaN(value)) {
      throw new HttpException(400, 'Invalid effectiveness value');
    }

    const typeEffective = await this.pokemonService.setTypeEffectiveness(pokemonId, type, value);

    res.status(201).json(
      plainToInstance(TypeEffectiveDto, typeEffective, {
        excludeExtraneousValues: true,
      })
    );
  });

  protected getFullTransformGroup(): string[] {
    return ['pokemon.full'];
  }
}
