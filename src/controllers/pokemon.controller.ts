import { Request, Response, Router } from 'express';
import { PokemonService } from '../services/pokemon.service';
import { BaseController } from './base.controller';
import { Pokemon } from '../entities/pokemon.entity';
import {
  PokemonDto,
  CreatePokemonDto,
  UpdatePokemonDto,
} from '../dtos/pokemon.dto';
import { validateDto } from '../middleware/validation.middleware';
import { isAuthenticated, isAdmin } from '../middleware/auth.middleware';
import { ValidationError } from '../errors';
import { plainToInstance } from 'class-transformer';
import { asyncHandler } from '../utils/error.utils';

export class PokemonController extends BaseController<Pokemon, PokemonDto> {
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
    this.router.post('/', isAuthenticated, isAdmin, validateDto(CreatePokemonDto), this.create);
    this.router.put('/:id', isAuthenticated, isAdmin, validateDto(UpdatePokemonDto), this.update);
    this.router.delete('/:id', isAuthenticated, isAdmin, this.delete);
  }

  // Pokemon methods
  getAllPokemon = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    let pokemon: Pokemon[];

    if (req.query.full === 'true') {
      pokemon = await this.pokemonService.findAllFull();
    } else {
      pokemon = await this.pokemonService.findAllBasic();
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
      pokemon = await this.pokemonService.findOneFull(id, req.body);
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

  protected getFullTransformGroup(): string[] {
    return ['pokemon.full', 'pokemonMove.full'];
  }
}
