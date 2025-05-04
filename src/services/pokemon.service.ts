import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Pokemon } from '../entities/pokemon.entity';
import { PokemonType } from '../entities/pokemon-type.entity';
import { PokemonAbility } from '../entities/pokemon-ability.entity';
import { PokemonMove } from '../entities/pokemon-move.entity';
import { TypeEffective } from '../entities/type-effective.entity';
import { BaseService } from './base.service';
import { HttpException } from '../utils/error.utils';
import { CreatePokemonDto } from '../dtos/pokemon.dto';
import { Service } from 'typedi';

@Service()
export class PokemonService extends BaseService<Pokemon> {
  constructor(
    @InjectRepository(Pokemon)
    private pokemonRepository: Repository<Pokemon>,

    @InjectRepository(PokemonType)
    private pokemonTypeRepository: Repository<PokemonType>,

    @InjectRepository(PokemonAbility)
    private pokemonAbilityRepository: Repository<PokemonAbility>,

    @InjectRepository(PokemonMove)
    private pokemonMoveRepository: Repository<PokemonMove>,

    @InjectRepository(TypeEffective)
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
      throw new HttpException(404, 'Pokemon not found');
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
      throw new HttpException(400, 'Pokemon with this name already exists');
    }

    const existingByDexId = await this.findByDexId(createPokemonDto.dexId);
    if (existingByDexId) {
      throw new HttpException(400, 'Pokemon with this Pokedex ID already exists');
    }

    // Create pokemon
    const pokemon = await this.pokemonRepository.create(createPokemonDto);

    // Add types if provided
    if (createPokemonDto.types && createPokemonDto.types.length > 0) {
      for (const typeDto of createPokemonDto.types) {
        await this.pokemonTypeRepository.save({
          pokemonId: pokemon.id,
          type: typeDto.type,
        });
      }
    }

    return this.findOneWithDetails(pokemon.id);
  }

  async addType(pokemonId: number, type: string): Promise<PokemonType> {
    // Check if pokemon exists
    await this.findOne(pokemonId);

    // Check if type already exists for this pokemon
    const existingType = await this.pokemonTypeRepository.findOne({
      where: {
        pokemonId,
        type,
      },
    });

    if (existingType) {
      throw new HttpException(400, 'This type is already assigned to this Pokemon');
    }

    // Add type
    return this.pokemonTypeRepository.save({
      pokemonId,
      type,
    });
  }

  async removeType(pokemonId: number, type: string): Promise<boolean> {
    // Check if pokemon exists
    await this.findOne(pokemonId);

    // Check if type exists for this pokemon
    const existingType = await this.pokemonTypeRepository.findOne({
      where: {
        pokemonId,
        type,
      },
    });

    if (!existingType) {
      throw new HttpException(404, 'This type is not assigned to this Pokemon');
    }

    // Remove type
    await this.pokemonTypeRepository.remove(existingType);
    return true;
  }

  async addAbility(pokemonId: number, abilityId: number): Promise<PokemonAbility> {
    // Check if pokemon exists
    await this.findOne(pokemonId);

    // Check if ability already exists for this pokemon
    const existingAbility = await this.pokemonAbilityRepository.findOne({
      where: {
        pokemonId,
        abilityId,
      },
    });

    if (existingAbility) {
      throw new HttpException(400, 'This ability is already assigned to this Pokemon');
    }

    // Add ability
    return this.pokemonAbilityRepository.save({
      pokemonId,
      abilityId,
    });
  }

  async removeAbility(pokemonId: number, abilityId: number): Promise<boolean> {
    // Check if pokemon exists
    await this.findOne(pokemonId);

    // Check if ability exists for this pokemon
    const existingAbility = await this.pokemonAbilityRepository.findOne({
      where: {
        pokemonId,
        abilityId,
      },
    });

    if (!existingAbility) {
      throw new HttpException(404, 'This ability is not assigned to this Pokemon');
    }

    // Remove ability
    await this.pokemonAbilityRepository.remove(existingAbility);
    return true;
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
      throw new HttpException(400, 'This move is already assigned to this Pokemon');
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
      throw new HttpException(404, 'This move is not assigned to this Pokemon');
    }

    // Remove move
    await this.pokemonMoveRepository.remove(existingMove);
    return true;
  }

  async setTypeEffectiveness(pokemonId: number, type: string, value: number): Promise<TypeEffective> {
    // Check if pokemon exists
    await this.findOne(pokemonId);

    // Check if type effectiveness already exists
    const existingEffectiveness = await this.typeEffectiveRepository.findOne({
      where: {
        pokemonId,
        type,
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
      type,
      value,
    });
  }
}
