import { Request, Response, Router } from 'express';
import { PokemonService } from '../services/pokemon.service';
import { BaseController } from './base.controller';
import { Pokemon } from '../entities/pokemon.entity';
import {
  PokemonDto,
  CreatePokemonDto,
  UpdatePokemonDto,
  PokemonMoveDto,
  TypeEffectiveDto,
} from '../dtos/pokemon.dto';
import { validateDto } from '../middleware/validation.middleware';
import { isAuthenticated, isAdmin } from '../middleware/auth.middleware';
import { ValidationError } from '../errors';
import { plainToInstance } from 'class-transformer';
import { asyncHandler } from '../utils/error.utils';

export class PokemonController extends BaseController<Pokemon, PokemonDto, CreatePokemonDto> {
  public router = Router();

  constructor(private pokemonService: PokemonService) {
    super(pokemonService, PokemonDto, CreatePokemonDto, UpdatePokemonDto as any);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Public routes
    this.router.get('/', this.getAllPokemon);
    this.router.get('/:id', this.getPokemonById);

    // Admin routes - Pokemon CRUD
    this.router.post('/', isAuthenticated, isAdmin, validateDto(CreatePokemonDto), this.create);
    this.router.put('/:id', isAuthenticated, isAdmin, validateDto(UpdatePokemonDto), this.update);
    this.router.delete('/:id', isAuthenticated, isAdmin, this.delete);

    // Move routes
    this.router.post('/:id/moves/:moveId', isAuthenticated, isAdmin, this.addMove);
    this.router.delete('/:id/moves/:moveId', isAuthenticated, isAdmin, this.removeMove);

    // Type effectiveness routes
    this.router.post('/:id/effectiveness/:typeId/:value', isAuthenticated, isAdmin, this.setTypeEffectiveness);
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
    if (isNaN(id)) {
      throw new ValidationError('Invalid Pokemon ID format');
    }

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

  // Move methods
  addMove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pokemonId = parseInt(req.params.id);
    const moveId = parseInt(req.params.moveId);
    const { gen } = req.body;

    if (isNaN(pokemonId)) {
      throw new ValidationError('Invalid Pokemon ID format');
    }
    if (isNaN(moveId)) {
      throw new ValidationError('Invalid Move ID format');
    }
    if (!gen) {
      throw new ValidationError('Generation (gen) is required');
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

    if (isNaN(pokemonId)) {
      throw new ValidationError('Invalid Pokemon ID format');
    }
    if (isNaN(moveId)) {
      throw new ValidationError('Invalid Move ID format');
    }

    await this.pokemonService.removeMove(pokemonId, moveId);

    res.status(204).send();
  });

  // Type effectiveness methods
  setTypeEffectiveness = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pokemonId = parseInt(req.params.id);
    const typeId = parseInt(req.params.typeId);
    const value = parseFloat(req.params.value);

    if (isNaN(pokemonId)) {
      throw new ValidationError('Invalid Pokemon ID format');
    }
    if (isNaN(typeId)) {
      throw new ValidationError('Invalid Type ID format');
    }
    if (isNaN(value)) {
      throw new ValidationError('Invalid effectiveness value');
    }

    const typeEffective = await this.pokemonService.setTypeEffectiveness(pokemonId, typeId, value);

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
