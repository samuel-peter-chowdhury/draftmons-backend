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
    const typeId = parseInt(req.params.typeId);
    const value = parseFloat(req.params.value);

    if (isNaN(value)) {
      throw new HttpException(400, 'Invalid effectiveness value');
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
