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
import { PaginationOptions } from '../services/base.service';

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
    if (req.query.full === 'true') {
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

  protected getFullTransformGroup(): string[] {
    return ['pokemon.full', 'pokemonMove.full'];
  }
}
