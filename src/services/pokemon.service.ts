import { Repository, Like, Between, In } from 'typeorm';
import { Pokemon } from '../entities/pokemon.entity';
import { BaseService, PaginationOptions, PaginatedResponse } from './base.service';
import { Service, Inject } from 'typedi';
import { PokemonSearchDto } from '../dtos/pokemon.dto';

@Service()
export class PokemonService extends BaseService<Pokemon> {

  private readonly basic_relations = {
    pokemonTypes: true,
    abilities: true,
  };

  private readonly detailed_relations = {
    ...this.basic_relations,
    pokemonMoves: {
      move: true,
    },
  };

  constructor(
    @Inject('PokemonRepository')
    private pokemonRepository: Repository<Pokemon>,
  ) {
    super(pokemonRepository, 'Pokemon');
  }

  private buildWhereClause(search: PokemonSearchDto): any {
    const where: any = {};

    // Direct matches
    if (search.dexId) where.dexId = search.dexId;
    if (search.name) where.name = Like(`%${search.name}%`);
    if (search.weight) where.weight = search.weight;
    if (search.height) where.height = search.height;

    // Range queries
    if (search.minHp || search.maxHp) {
      where.hp = Between(search.minHp || 0, search.maxHp || 999);
    }
    if (search.minAttack || search.maxAttack) {
      where.attack = Between(search.minAttack || 0, search.maxAttack || 999);
    }
    if (search.minDefense || search.maxDefense) {
      where.defense = Between(search.minDefense || 0, search.maxDefense || 999);
    }
    if (search.minSpecialAttack || search.maxSpecialAttack) {
      where.specialAttack = Between(search.minSpecialAttack || 0, search.maxSpecialAttack || 999);
    }
    if (search.minSpecialDefense || search.maxSpecialDefense) {
      where.specialDefense = Between(search.minSpecialDefense || 0, search.maxSpecialDefense || 999);
    }
    if (search.minSpeed || search.maxSpeed) {
      where.speed = Between(search.minSpeed || 0, search.maxSpeed || 999);
    }
    if (search.minBaseStatTotal || search.maxBaseStatTotal) {
      where.baseStatTotal = Between(search.minBaseStatTotal || 0, search.maxBaseStatTotal || 999);
    }

    // Relation queries
    if (search.pokemonTypeId) {
      where.pokemonTypes = { id: search.pokemonTypeId };
    }
    if (search.pokemonMoveId) {
      where.pokemonMoves = { id: search.pokemonMoveId };
    }
    if (search.abilityId) {
      where.abilities = { id: search.abilityId };
    }
    if (search.generationId) {
      where.generations = { id: search.generationId };
    }
    if (search.seasonId) {
      where.seasonPokemon = { seasonId: search.seasonId };
    }

    return where;
  }

  async findOneBasic(id: number, where?: any): Promise<Pokemon> {
    return this.findOne(id, where, this.basic_relations);
  }

  async findOneFull(id: number, where?: any): Promise<Pokemon> {
    return this.findOne(id, where, this.detailed_relations);
  }

  async findAllBasic(where?: any, pagination?: PaginationOptions, order?: { [key: string]: 'ASC' | 'DESC' }): Promise<PaginatedResponse<Pokemon> | Pokemon[]> {
    return this.findAll(where, this.basic_relations, pagination, order);
  }

  async findAllFull(where?: any, pagination?: PaginationOptions, order?: { [key: string]: 'ASC' | 'DESC' }): Promise<PaginatedResponse<Pokemon> | Pokemon[]> {
    return this.findAll(where, this.detailed_relations, pagination, order);
  }

  async search(search: PokemonSearchDto, pagination?: PaginationOptions): Promise<PaginatedResponse<Pokemon> | Pokemon[]> {
    const where = this.buildWhereClause(search);
    const order = search.sortBy ? { [search.sortBy]: search.sortOrder || 'ASC' } : undefined;

    if (search.pokemonMoveId || search.generationId || search.seasonId) {
      return this.findAllFull(where, pagination, order);
    }
    return this.findAllBasic(where, pagination, order);
  }
}
