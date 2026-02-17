import { Service } from 'typedi';
import { Dex } from '@pkmn/dex';
import AppDataSource from '../config/database.config';
import { Generation } from '../entities/generation.entity';
import { PokemonType } from '../entities/pokemon-type.entity';
import { SpecialMoveCategory } from '../entities/special-move-category.entity';
import { Ability } from '../entities/ability.entity';
import { Move, MoveCategory } from '../entities/move.entity';
import { Pokemon } from '../entities/pokemon.entity';
import { TypeEffective } from '../entities/type-effective.entity';
import { generationData } from '../data/generation.data';
import { pokemonTypeData } from '../data/pokemon-type.data';
import { specialMoveCategoryData } from '../data/special-move-category.data';
import { specialMoveData } from '../data/special-move.data';
import { typeEffectiveData } from '../data/type-effective.data';
import { abilityResistData } from '../data/ability-resist.data';

const LATEST_GEN = 9;
const NAT_DEX_GENERATION_ID = 10;

@Service()
export class AdminService {
  /**
   * Wipes all data from the database except the user table.
   * Uses TRUNCATE with RESTART IDENTITY CASCADE to handle foreign key
   * constraints and reset auto-increment sequences.
   */
  async wipeAllData(): Promise<void> {
    const entities = AppDataSource.entityMetadatas;
    const tableNames = entities
      .filter(entity => entity.tableName !== 'user')
      .map(entity => `"${entity.tableName}"`)
      .join(', ');
    await AppDataSource.query(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`);
  }

  /**
   * Initializes all Pokemon-related data (types, generations, abilities, moves, pokemon, etc.)
   * using fixture data and third-party data sources.
   */
  async initializePokemonData(): Promise<void> {
    await this.initializeGenerations();
    await this.initializePokemonTypes();
    await this.initializeSpecialMoveCategories();
    await this.initializeAbilities();
    await this.initializeMoves();
    await this.initializePokemon();
  }

  /**
   * Creates mock data for non-Pokemon related tables (users, leagues, seasons, teams, etc.).
   * Depends on Pokemon data being initialized first.
   */
  async createMockData(): Promise<void> {
    // TODO: Implement mock data creation
  }

  private async initializeGenerations(): Promise<void> {
    await AppDataSource.createQueryBuilder()
      .insert()
      .into(Generation)
      .values(generationData)
      .execute();
    await this.resetSequence('generation');
  }

  private async initializePokemonTypes(): Promise<void> {
    await AppDataSource.createQueryBuilder()
      .insert()
      .into(PokemonType)
      .values(pokemonTypeData)
      .execute();
    await this.resetSequence('pokemon_type');
  }

  private async initializeSpecialMoveCategories(): Promise<void> {
    await AppDataSource.createQueryBuilder()
      .insert()
      .into(SpecialMoveCategory)
      .values(specialMoveCategoryData)
      .execute();
    await this.resetSequence('special_move_category');
  }

  /**
   * Initializes abilities for each generation 1-9 from @pkmn/dex,
   * then creates a "nat dex" set (generation 10) containing all unique
   * abilities with descriptions from the latest generation they appear in.
   */
  private async initializeAbilities(): Promise<void> {
    const allAbilities: { name: string; description: string; generationId: number }[] = [];
    const natDexMap = new Map<string, string>();

    for (let gen = 1; gen <= LATEST_GEN; gen++) {
      const dex = Dex.forGen(gen as any);
      const abilities = dex.abilities
        .all()
        .filter((a) => !a.isNonstandard && a.name !== 'No Ability')
        .map((a) => ({
          name: a.name,
          description: a.desc || a.shortDesc || '',
        }));

      for (const ability of abilities) {
        allAbilities.push({ ...ability, generationId: gen });
        // Later generations overwrite earlier ones, keeping the most recent description
        natDexMap.set(ability.name, ability.description);
      }
    }

    // Add nat dex abilities (unique set with latest descriptions)
    for (const [name, description] of natDexMap) {
      allAbilities.push({ name, description, generationId: NAT_DEX_GENERATION_ID });
    }

    await AppDataSource.createQueryBuilder()
      .insert()
      .into(Ability)
      .values(allAbilities)
      .execute();
    await this.resetSequence('ability');
  }

  /**
   * Initializes moves for each generation 1-9 from @pkmn/dex,
   * then creates a "nat dex" set (generation 10) containing all unique
   * moves with data from the latest generation they appear in.
   * Also populates the move_special_move_categories join table.
   */
  private async initializeMoves(): Promise<void> {
    const pokemonTypeMap = await this.buildPokemonTypeMap();

    interface MoveData {
      name: string;
      pokemonTypeId: number;
      category: MoveCategory;
      power: number;
      accuracy: number;
      priority: number;
      pp: number;
      description: string;
    }

    const allMoves: (MoveData & { generationId: number })[] = [];
    const natDexMap = new Map<string, MoveData>();

    for (let gen = 1; gen <= LATEST_GEN; gen++) {
      const dex = Dex.forGen(gen as any);
      const moves = dex.moves
        .all()
        .filter((m) => !m.isNonstandard);

      for (const m of moves) {
        const pokemonTypeId = pokemonTypeMap.get(m.type.toLowerCase());
        if (pokemonTypeId === undefined) continue;

        const moveData: MoveData = {
          name: m.name,
          pokemonTypeId,
          category: m.category.toUpperCase() as MoveCategory,
          power: m.basePower,
          accuracy: m.accuracy === true ? 0 : m.accuracy as number,
          priority: m.priority,
          pp: m.pp,
          description: m.desc || m.shortDesc || '',
        };

        allMoves.push({ ...moveData, generationId: gen });
        natDexMap.set(m.name, moveData);
      }
    }

    // Add nat dex moves (unique set with latest data)
    for (const [, moveData] of natDexMap) {
      allMoves.push({ ...moveData, generationId: NAT_DEX_GENERATION_ID });
    }

    await AppDataSource.createQueryBuilder()
      .insert()
      .into(Move)
      .values(allMoves)
      .execute();
    await this.resetSequence('move');

    await this.linkMovesToSpecialMoveCategories();
  }

  /**
   * Populates the move_special_move_categories join table by matching
   * inserted moves to special move categories using the fixture data.
   * Matching is case-insensitive. All generations' versions of a matching
   * move are linked to its categories.
   */
  private async linkMovesToSpecialMoveCategories(): Promise<void> {
    // Load all special move categories and build a case-insensitive lookup
    const categoryRepository = AppDataSource.getRepository(SpecialMoveCategory);
    const allCategories = await categoryRepository.find({ select: ['id', 'name'] });
    const categoryIdByName = new Map<string, number>();
    for (const category of allCategories) {
      categoryIdByName.set(category.name.toLowerCase(), category.id);
    }

    // Load all inserted moves and build join entries via O(1) lookup per move
    const moveRepository = AppDataSource.getRepository(Move);
    const allMoves = await moveRepository.find({ select: ['id', 'name'] });
    const joinEntries: { move_id: number; special_move_category_id: number }[] = [];

    for (const move of allMoves) {
      const categories = specialMoveData[move.name.toLowerCase()];
      if (!categories) continue;

      for (const categoryName of categories) {
        const categoryId = categoryIdByName.get(categoryName.toLowerCase());
        if (categoryId === undefined) continue;
        joinEntries.push({ move_id: move.id, special_move_category_id: categoryId });
      }
    }

    if (joinEntries.length > 0) {
      await AppDataSource.createQueryBuilder()
        .insert()
        .into('move_special_move_categories')
        .values(joinEntries)
        .execute();
    }
  }

  /**
   * Initializes Pokemon for each generation 1-9 from @pkmn/dex,
   * then creates a "nat dex" set (generation 10) containing all unique
   * Pokemon with data from the latest generation they appear in.
   * Also populates the pokemon_pokemon_types, pokemon_abilities,
   * and pokemon_moves join tables.
   */
  private async initializePokemon(): Promise<void> {
    const pokemonTypeMap = await this.buildPokemonTypeMap();

    interface PokemonMeta {
      name: string;
      generationId: number;
      typeNames: string[];
      abilityNames: string[];
      moveNames: string[];
    }

    interface PokemonInsert {
      dexId: number;
      name: string;
      hp: number;
      attack: number;
      defense: number;
      specialAttack: number;
      specialDefense: number;
      speed: number;
      baseStatTotal: number;
      height: number;
      weight: number;
      sprite: string;
      generationId: number;
    }

    interface NatDexPokemonData {
      insert: Omit<PokemonInsert, 'generationId'>;
      typeNames: string[];
      abilityNames: string[];
      moveNames: string[];
    }

    const allPokemonInserts: PokemonInsert[] = [];
    const allPokemonMeta: PokemonMeta[] = [];
    const natDexMap = new Map<string, NatDexPokemonData>();

    for (let gen = 1; gen <= LATEST_GEN; gen++) {
      const dex = Dex.forGen(gen as any);
      const allSpecies = dex.species.all().filter((s) => !s.isNonstandard);

      // Process all pokemon in this generation concurrently
      const results = await Promise.all(allSpecies.map(async (species) => {
        // Extract ability names
        const abilityNames: string[] = [];
        for (const [, abilityName] of Object.entries(species.abilities)) {
          if (!abilityName) continue;
          const ability = dex.abilities.get(abilityName);
          if (!ability.exists || ability.isNonstandard || ability.name === 'No Ability') continue;
          if (!abilityNames.includes(ability.name)) {
            abilityNames.push(ability.name);
          }
        }

        // Collect learnset and extract moves
        const learnsetSources = await this.collectLearnsets(dex, species);
        const genMoveNames = this.extractMoveNamesForGen(dex, learnsetSources, gen);
        // Unfiltered moves for nat dex (computed every gen, latest overwrites)
        const allMoveNames = this.extractAllMoveNames(dex, learnsetSources);

        return {
          species,
          abilityNames,
          genMoveNames,
          allMoveNames,
        };
      }));

      for (const { species, abilityNames, genMoveNames, allMoveNames } of results) {
        const pokemonInsert = {
          dexId: species.num,
          name: species.name,
          hp: species.baseStats.hp,
          attack: species.baseStats.atk,
          defense: species.baseStats.def,
          specialAttack: species.baseStats.spa,
          specialDefense: species.baseStats.spd,
          speed: species.baseStats.spe,
          baseStatTotal: species.bst,
          height: (species as any).heightm || 0,
          weight: species.weightkg || 0,
          sprite: '',
        };

        allPokemonInserts.push({ ...pokemonInsert, generationId: gen });
        allPokemonMeta.push({
          name: species.name,
          generationId: gen,
          typeNames: species.types,
          abilityNames,
          moveNames: genMoveNames,
        });

        // Track for nat dex: later generations overwrite earlier ones
        natDexMap.set(species.name, {
          insert: pokemonInsert,
          typeNames: species.types,
          abilityNames,
          moveNames: allMoveNames,
        });
      }
    }

    // Add nat dex pokemon (all unique pokemon from any generation, using latest data)
    for (const [name, data] of natDexMap) {
      allPokemonInserts.push({ ...data.insert, generationId: NAT_DEX_GENERATION_ID });
      allPokemonMeta.push({
        name,
        generationId: NAT_DEX_GENERATION_ID,
        typeNames: data.typeNames,
        abilityNames: data.abilityNames,
        moveNames: data.moveNames,
      });
    }

    // Bulk insert pokemon (batched to avoid parameter limits)
    await this.batchInsert(Pokemon, allPokemonInserts);
    await this.resetSequence('pokemon');

    // Build join tables
    await this.linkPokemonRelations(allPokemonMeta, pokemonTypeMap);
  }

  /**
   * Builds and inserts all Pokemon join table entries (types, abilities, moves).
   */
  private async linkPokemonRelations(
    allPokemonMeta: { name: string; generationId: number; typeNames: string[]; abilityNames: string[]; moveNames: string[] }[],
    pokemonTypeMap: Map<string, number>,
  ): Promise<void> {
    // Build pokemon lookup: "name_lower|generationId" → pokemonId
    const pokemonRepo = AppDataSource.getRepository(Pokemon);
    const allPokemon = await pokemonRepo.find({ select: ['id', 'name', 'generationId'] });
    const pokemonLookup = new Map<string, number>();
    for (const p of allPokemon) {
      pokemonLookup.set(`${p.name.toLowerCase()}|${p.generationId}`, p.id);
    }

    // Build ability lookup: "name_lower|generationId" → abilityId
    const abilityRepo = AppDataSource.getRepository(Ability);
    const allAbilities = await abilityRepo.find({ select: ['id', 'name', 'generationId'] });
    const abilityLookup = new Map<string, number>();
    for (const a of allAbilities) {
      abilityLookup.set(`${a.name.toLowerCase()}|${a.generationId}`, a.id);
    }

    // Build move lookup: "name_lower|generationId" → moveId
    const moveRepo = AppDataSource.getRepository(Move);
    const allMoves = await moveRepo.find({ select: ['id', 'name', 'generationId'] });
    const moveLookup = new Map<string, number>();
    for (const m of allMoves) {
      moveLookup.set(`${m.name.toLowerCase()}|${m.generationId}`, m.id);
    }

    // Get all attacking type names for type effectiveness calculation
    const allTypeNames = [...pokemonTypeMap.keys()];

    const typeJoins: { pokemon_id: number; pokemon_type_id: number }[] = [];
    const abilityJoins: { pokemon_id: number; ability_id: number }[] = [];
    const moveJoins: { pokemon_id: number; move_id: number }[] = [];
    const typeEffectives: { pokemonId: number; pokemonTypeId: number; value: number }[] = [];

    for (const meta of allPokemonMeta) {
      const pokemonId = pokemonLookup.get(`${meta.name.toLowerCase()}|${meta.generationId}`);
      if (!pokemonId) continue;

      // Types
      for (const typeName of meta.typeNames) {
        const typeId = pokemonTypeMap.get(typeName.toLowerCase());
        if (typeId) {
          typeJoins.push({ pokemon_id: pokemonId, pokemon_type_id: typeId });
        }
      }

      // Abilities
      for (const abilityName of meta.abilityNames) {
        const abilityId = abilityLookup.get(`${abilityName.toLowerCase()}|${meta.generationId}`);
        if (abilityId) {
          abilityJoins.push({ pokemon_id: pokemonId, ability_id: abilityId });
        }
      }

      // Moves
      for (const moveName of meta.moveNames) {
        const moveId = moveLookup.get(`${moveName.toLowerCase()}|${meta.generationId}`);
        if (moveId) {
          moveJoins.push({ pokemon_id: pokemonId, move_id: moveId });
        }
      }

      // Type effectiveness (18 rows per pokemon)
      const defendingTypes = meta.typeNames.map((t) => t.toLowerCase());
      for (const atkType of allTypeNames) {
        const atkTypeId = pokemonTypeMap.get(atkType);
        if (!atkTypeId) continue;

        const atkChart = typeEffectiveData[atkType];
        if (!atkChart) continue;

        // Multiply effectiveness across all defending types
        let value = 1;
        for (const defType of defendingTypes) {
          value *= atkChart[defType] ?? 1;
        }

        // Apply ability-based modifiers
        for (const abilityName of meta.abilityNames) {
          const abilityModifiers = abilityResistData[abilityName.toLowerCase()];
          if (!abilityModifiers) continue;
          const modifier = abilityModifiers[atkType];
          if (modifier !== undefined) {
            value *= modifier;
          }
        }

        typeEffectives.push({ pokemonId, pokemonTypeId: atkTypeId, value });
      }
    }

    // Batch insert all join tables and type effectiveness
    await this.batchInsertRaw('pokemon_pokemon_types', typeJoins);
    await this.batchInsertRaw('pokemon_abilities', abilityJoins);
    await this.batchInsertRaw('pokemon_moves', moveJoins);
    await this.batchInsert(TypeEffective, typeEffectives);
    await this.resetSequence('type_effective');
  }

  /**
   * Collects all learnset sources for a species, walking the prevo chain.
   * Handles alternate forms via changesFrom.
   * Based on the collectLearnsets function from the @pkmn/dex reference API.
   */
  private async collectLearnsets(dex: any, species: any): Promise<Record<string, string[]>> {
    const allSources: Record<string, string[]> = {};
    let current = species;

    if (current.changesFrom) {
      current = dex.species.get(current.changesFrom);
    }

    while (current && current.exists) {
      const data = await dex.learnsets.get(current.id);
      if (data && data.learnset) {
        for (const [moveId, sources] of Object.entries(data.learnset)) {
          if (!allSources[moveId]) allSources[moveId] = [];
          allSources[moveId].push(...(sources as string[]));
        }
      }
      if (current.prevo) {
        current = dex.species.get(current.prevo);
      } else {
        break;
      }
    }

    return allSources;
  }

  /**
   * Extracts move names that are learnable in a specific generation.
   * Filters learnset sources by checking if the first character matches the generation number.
   */
  private extractMoveNamesForGen(dex: any, learnsetSources: Record<string, string[]>, gen: number): string[] {
    const moveNames: string[] = [];
    for (const [moveId, sources] of Object.entries(learnsetSources)) {
      const hasValidSource = sources.some((s) => parseInt(s.charAt(0), 10) === gen);
      if (!hasValidSource) continue;

      const move = dex.moves.get(moveId);
      if (!move.exists || move.isNonstandard) continue;
      moveNames.push(move.name);
    }
    return moveNames;
  }

  /**
   * Extracts all move names from a learnset regardless of generation.
   * Used for building the nat dex move pool.
   */
  private extractAllMoveNames(dex: any, learnsetSources: Record<string, string[]>): string[] {
    const moveNames: string[] = [];
    for (const moveId of Object.keys(learnsetSources)) {
      const move = dex.moves.get(moveId);
      if (!move.exists || move.isNonstandard) continue;
      moveNames.push(move.name);
    }
    return moveNames;
  }

  /**
   * Builds a case-insensitive lookup map from PokemonType name to id
   * using the previously inserted fixture data.
   */
  private async buildPokemonTypeMap(): Promise<Map<string, number>> {
    const pokemonTypeRepository = AppDataSource.getRepository(PokemonType);
    const pokemonTypes = await pokemonTypeRepository.find();
    const map = new Map<string, number>();
    for (const pt of pokemonTypes) {
      map.set(pt.name.toLowerCase(), pt.id);
    }
    return map;
  }

  /**
   * Batch inserts entity rows to avoid PostgreSQL's parameter limit.
   */
  private async batchInsert(entity: any, values: any[], batchSize: number = 5000): Promise<void> {
    for (let i = 0; i < values.length; i += batchSize) {
      const batch = values.slice(i, i + batchSize);
      await AppDataSource.createQueryBuilder()
        .insert()
        .into(entity)
        .values(batch)
        .execute();
    }
  }

  /**
   * Batch inserts into a raw table (e.g. join tables) to avoid PostgreSQL's parameter limit.
   */
  private async batchInsertRaw(tableName: string, values: any[], batchSize: number = 10000): Promise<void> {
    for (let i = 0; i < values.length; i += batchSize) {
      const batch = values.slice(i, i + batchSize);
      await AppDataSource.createQueryBuilder()
        .insert()
        .into(tableName)
        .values(batch)
        .execute();
    }
  }

  /**
   * Resets the auto-increment sequence for a table to the current max ID.
   * Required after inserting rows with explicit IDs to prevent conflicts
   * on subsequent inserts without explicit IDs.
   */
  private async resetSequence(tableName: string): Promise<void> {
    await AppDataSource.query(
      `SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), (SELECT MAX(id) FROM "${tableName}"))`,
    );
  }
}
