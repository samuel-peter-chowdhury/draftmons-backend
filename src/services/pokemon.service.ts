import { Repository } from 'typeorm';
import { Pokemon } from '../entities/pokemon.entity';
import { PokemonMove } from '../entities/pokemon-move.entity';
import { TypeEffective } from '../entities/type-effective.entity';
import { BaseService } from './base.service';
import { NotFoundError, ConflictError } from '../errors';
import { CreatePokemonDto } from '../dtos/pokemon.dto';
import { Service, Inject } from 'typedi';

@Service()
export class PokemonService extends BaseService<Pokemon> {
  constructor(
    @Inject('PokemonRepository')
    private pokemonRepository: Repository<Pokemon>,

    @Inject('PokemonMoveRepository')
    private pokemonMoveRepository: Repository<PokemonMove>,

    @Inject('TypeEffectiveRepository')
    private typeEffectiveRepository: Repository<TypeEffective>
  ) {
    super(pokemonRepository);
  }

  async findAllWithDetails(): Promise<Pokemon[]> {
    return this.pokemonRepository.find({
      relations: ['types', 'abilities', 'abilities.ability', 'typeEffectiveness'],
    });
  }

  async findOneWithDetails(id: number): Promise<Pokemon> {
    const pokemon = await this.pokemonRepository.findOne({
      where: { id },
      relations: ['types', 'abilities', 'abilities.ability', 'typeEffectiveness'],
    });

    if (!pokemon) {
      throw new NotFoundError('Pokemon', id);
    }

    return pokemon;
  }

  async findByName(name: string): Promise<Pokemon | null> {
    return this.pokemonRepository.findOne({
      where: { name },
    });
  }

  async findByDexId(dexId: number): Promise<Pokemon | null> {
    return this.pokemonRepository.findOne({
      where: { dexId },
    });
  }

  async createPokemon(createPokemonDto: CreatePokemonDto): Promise<Pokemon> {
    // Check if pokemon with same name or dexId already exists
    const existingByName = await this.findByName(createPokemonDto.name);
    if (existingByName) {
      throw new ConflictError('Pokemon with this name already exists');
    }

    const existingByDexId = await this.findByDexId(createPokemonDto.dexId);
    if (existingByDexId) {
      throw new ConflictError('Pokemon with this Pokedex ID already exists');
    }

    // Create pokemon
    const pokemon = await this.pokemonRepository.create(createPokemonDto);

    return this.findOneWithDetails(pokemon.id);
  }

  async addMove(pokemonId: number, moveId: number, gen: string): Promise<PokemonMove> {
    // Check if pokemon exists
    await this.findOne(pokemonId);

    // Check if move already exists for this pokemon
    const existingMove = await this.pokemonMoveRepository.findOne({
      where: {
        pokemonId,
        moveId,
      },
    });

    if (existingMove) {
      throw new ConflictError('This move is already assigned to this Pokemon');
    }

    // Add move
    return this.pokemonMoveRepository.save({
      pokemonId,
      moveId,
      gen,
    });
  }

  async removeMove(pokemonId: number, moveId: number): Promise<boolean> {
    // Check if pokemon exists
    await this.findOne(pokemonId);

    // Check if move exists for this pokemon
    const existingMove = await this.pokemonMoveRepository.findOne({
      where: {
        pokemonId,
        moveId,
      },
    });

    if (!existingMove) {
      throw new NotFoundError('Pokemon move', `${pokemonId}-${moveId}`);
    }

    // Remove move
    await this.pokemonMoveRepository.remove(existingMove);
    return true;
  }

  async setTypeEffectiveness(pokemonId: number, pokemonTypeId: number, value: number): Promise<TypeEffective> {
    // Check if pokemon exists
    await this.findOne(pokemonId);

    // Check if type effectiveness already exists
    const existingEffectiveness = await this.typeEffectiveRepository.findOne({
      where: {
        pokemonId,
        pokemonTypeId,
      },
    });

    if (existingEffectiveness) {
      // Update value
      existingEffectiveness.value = value;
      return this.typeEffectiveRepository.save(existingEffectiveness);
    }

    // Create new effectiveness
    return this.typeEffectiveRepository.save({
      pokemonId,
      pokemonTypeId,
      value,
    });
  }
}
