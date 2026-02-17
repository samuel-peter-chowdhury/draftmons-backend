import { Service } from 'typedi';
import { Dex } from '@pkmn/dex';
import { faker } from '@faker-js/faker';
import AppDataSource from '../config/database.config';
import { Generation } from '../entities/generation.entity';
import { PokemonType } from '../entities/pokemon-type.entity';
import { SpecialMoveCategory } from '../entities/special-move-category.entity';
import { Ability } from '../entities/ability.entity';
import { Move, MoveCategory } from '../entities/move.entity';
import { Pokemon } from '../entities/pokemon.entity';
import { TypeEffective } from '../entities/type-effective.entity';
import { User } from '../entities/user.entity';
import { League } from '../entities/league.entity';
import { LeagueUser } from '../entities/league-user.entity';
import { Season } from '../entities/season.entity';
import { Team } from '../entities/team.entity';
import { Week } from '../entities/week.entity';
import { Match } from '../entities/match.entity';
import { Game } from '../entities/game.entity';
import { GameStat } from '../entities/game-stat.entity';
import { SeasonPokemon } from '../entities/season-pokemon.entity';
import { SeasonPokemonTeam } from '../entities/season-pokemon-team.entity';
import { generationData } from '../data/generation.data';
import { pokemonTypeData } from '../data/pokemon-type.data';
import { specialMoveCategoryData } from '../data/special-move-category.data';
import { specialMoveData } from '../data/special-move.data';
import { typeEffectiveData } from '../data/type-effective.data';
import { abilityResistData } from '../data/ability-resist.data';
import {
  mockUsers,
  mockLeagues,
  mockLeagueAssignments,
  mockSeasons,
  roundRobinSchedule,
  SEASON_POKEMON_POOL_SIZE,
  TEAM_ROSTER_SIZE,
} from '../data/mock.data';

const LATEST_GEN = 9;
const NAT_DEX_GENERATION_ID = 10;

@Service()
export class AdminService {
  /**
   * Wipes all data from the database except admin users.
   * Truncates all non-user tables with RESTART IDENTITY CASCADE,
   * then deletes non-admin users.
   */
  async wipeAllData(): Promise<void> {
    const entities = AppDataSource.entityMetadatas;
    const tableNames = entities
      .filter(entity => entity.tableName !== 'user')
      .map(entity => `"${entity.tableName}"`)
      .join(', ');
    await AppDataSource.query(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`);
    await AppDataSource.query(`DELETE FROM "user" WHERE "is_admin" = false`);
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
   * Uses @faker-js/faker with a fixed seed for deterministic, reproducible output.
   * Depends on Pokemon data being initialized first.
   */
  async createMockData(): Promise<void> {
    faker.seed(42);

    const userIds = await this.createMockUsers();
    const leagueIds = await this.createMockLeagues();
    await this.createMockLeagueUsers(userIds, leagueIds);
    const seasonIds = await this.createMockSeasons(leagueIds);
    const teamIdsBySeason = await this.createMockTeams(seasonIds, userIds);
    const weekIdsBySeason = await this.createMockWeeks(seasonIds);
    const seasonPokemonByTeam = await this.createMockDraft(seasonIds, teamIdsBySeason);
    await this.createMockCompetition(weekIdsBySeason, teamIdsBySeason, seasonPokemonByTeam);
  }

  /**
   * Creates 8 mock Pokemon trainer users.
   * Returns their IDs in insertion order.
   */
  private async createMockUsers(): Promise<number[]> {
    await AppDataSource.createQueryBuilder()
      .insert()
      .into(User)
      .values(mockUsers)
      .execute();

    const users = await AppDataSource.getRepository(User).find({
      where: { isAdmin: false },
      select: ['id'],
      order: { id: 'ASC' },
    });
    return users.map(u => u.id);
  }

  /**
   * Creates 2 mock leagues.
   * Returns their IDs in insertion order.
   */
  private async createMockLeagues(): Promise<number[]> {
    await AppDataSource.createQueryBuilder()
      .insert()
      .into(League)
      .values(mockLeagues)
      .execute();

    const leagues = await AppDataSource.getRepository(League).find({
      select: ['id'],
      order: { id: 'ASC' },
    });
    return leagues.map(l => l.id);
  }

  /**
   * Creates league-user memberships with moderator assignments.
   */
  private async createMockLeagueUsers(userIds: number[], leagueIds: number[]): Promise<void> {
    const leagueUsers: { leagueId: number; userId: number; isModerator: boolean }[] = [];

    for (const assignment of mockLeagueAssignments) {
      const leagueId = leagueIds[assignment.leagueIndex];
      for (const userIndex of assignment.userIndices) {
        leagueUsers.push({
          leagueId,
          userId: userIds[userIndex],
          isModerator: userIndex === assignment.moderatorIndex,
        });
      }
    }

    await AppDataSource.createQueryBuilder()
      .insert()
      .into(LeagueUser)
      .values(leagueUsers)
      .execute();
  }

  /**
   * Creates 3 mock seasons across the 2 leagues with varying statuses and generations.
   * Returns their IDs in insertion order.
   */
  private async createMockSeasons(leagueIds: number[]): Promise<number[]> {
    const seasons = mockSeasons.map(s => ({
      name: s.name,
      status: s.status,
      pointLimit: s.pointLimit,
      maxPointValue: s.maxPointValue,
      ...(s.rules !== null && { rules: s.rules }),
      leagueId: leagueIds[s.leagueIndex],
      generationId: s.generationId,
    }));

    await AppDataSource.createQueryBuilder()
      .insert()
      .into(Season)
      .values(seasons)
      .execute();

    const savedSeasons = await AppDataSource.getRepository(Season).find({
      select: ['id'],
      order: { id: 'ASC' },
    });
    return savedSeasons.map(s => s.id);
  }

  /**
   * Creates mock teams for each active season.
   * Returns a map of seasonId -> team IDs in insertion order.
   */
  private async createMockTeams(
    seasonIds: number[],
    userIds: number[],
  ): Promise<Map<number, number[]>> {
    const teams: { name: string; seasonId: number; userId: number }[] = [];

    for (let i = 0; i < mockSeasons.length; i++) {
      const config = mockSeasons[i];
      const seasonId = seasonIds[i];
      for (let j = 0; j < config.teamNames.length; j++) {
        teams.push({
          name: config.teamNames[j],
          seasonId,
          userId: userIds[config.userIndices[j]],
        });
      }
    }

    if (teams.length === 0) return new Map();

    await AppDataSource.createQueryBuilder()
      .insert()
      .into(Team)
      .values(teams)
      .execute();

    const savedTeams = await AppDataSource.getRepository(Team).find({
      select: ['id', 'seasonId'],
      order: { id: 'ASC' },
    });

    const teamIdsBySeason = new Map<number, number[]>();
    for (const team of savedTeams) {
      if (!teamIdsBySeason.has(team.seasonId)) {
        teamIdsBySeason.set(team.seasonId, []);
      }
      teamIdsBySeason.get(team.seasonId)!.push(team.id);
    }
    return teamIdsBySeason;
  }

  /**
   * Creates mock weeks for each active season.
   * Returns a map of seasonId -> week IDs in insertion order.
   */
  private async createMockWeeks(seasonIds: number[]): Promise<Map<number, number[]>> {
    const weeks: { name: string; seasonId: number }[] = [];

    for (let i = 0; i < mockSeasons.length; i++) {
      const config = mockSeasons[i];
      const seasonId = seasonIds[i];
      for (const weekName of config.weekNames) {
        weeks.push({ name: weekName, seasonId });
      }
    }

    if (weeks.length === 0) return new Map();

    await AppDataSource.createQueryBuilder()
      .insert()
      .into(Week)
      .values(weeks)
      .execute();

    const savedWeeks = await AppDataSource.getRepository(Week).find({
      select: ['id', 'seasonId'],
      order: { id: 'ASC' },
    });

    const weekIdsBySeason = new Map<number, number[]>();
    for (const week of savedWeeks) {
      if (!weekIdsBySeason.has(week.seasonId)) {
        weekIdsBySeason.set(week.seasonId, []);
      }
      weekIdsBySeason.get(week.seasonId)!.push(week.id);
    }
    return weekIdsBySeason;
  }

  /**
   * Creates season Pokemon pools and simulates a snake draft to assign rosters.
   * For each active season: queries random Pokemon from the generation, assigns
   * tiered point values based on base stat total, then runs a snake draft
   * to fill each team's roster of 10 Pokemon within the point budget.
   * Returns a map of teamId -> season Pokemon IDs (the team's roster).
   */
  private async createMockDraft(
    seasonIds: number[],
    teamIdsBySeason: Map<number, number[]>,
  ): Promise<Map<number, number[]>> {
    const seasonPokemonByTeam = new Map<number, number[]>();
    const pokemonRepo = AppDataSource.getRepository(Pokemon);
    const seasonPokemonRepo = AppDataSource.getRepository(SeasonPokemon);

    for (let i = 0; i < mockSeasons.length; i++) {
      const config = mockSeasons[i];
      const seasonId = seasonIds[i];
      const teamIds = teamIdsBySeason.get(seasonId);
      if (!teamIds || teamIds.length === 0) continue;

      // Query Pokemon for this generation, sorted by base stat total
      const pokemon = await pokemonRepo.find({
        where: { generationId: config.generationId },
        select: ['id', 'baseStatTotal'],
        order: { baseStatTotal: 'DESC' },
      });

      // Randomly select a pool of Pokemon for this season
      const poolSize = Math.min(SEASON_POKEMON_POOL_SIZE, pokemon.length);
      const selected = faker.helpers.arrayElements(pokemon, poolSize);
      selected.sort((a, b) => b.baseStatTotal - a.baseStatTotal);

      // Assign tiered point values based on base stat ranking
      const seasonPokemonValues = selected.map((p, idx) => {
        const percentile = idx / selected.length;
        let pointValue: number;
        if (percentile < 0.13) pointValue = faker.number.int({ min: 10, max: 12 });
        else if (percentile < 0.33) pointValue = faker.number.int({ min: 7, max: 9 });
        else if (percentile < 0.60) pointValue = faker.number.int({ min: 4, max: 6 });
        else pointValue = faker.number.int({ min: 1, max: 3 });

        return { seasonId, pokemonId: p.id, pointValue };
      });

      await AppDataSource.createQueryBuilder()
        .insert()
        .into(SeasonPokemon)
        .values(seasonPokemonValues)
        .execute();

      // Query back with IDs for draft simulation
      const savedSeasonPokemon = await seasonPokemonRepo.find({
        where: { seasonId },
        select: ['id', 'pointValue'],
        order: { pointValue: 'DESC', id: 'ASC' },
      });

      // Simulate snake draft
      const available = [...savedSeasonPokemon];
      const teamRosters = new Map<number, { id: number; pointValue: number | null }[]>();
      const teamBudgets = new Map<number, number>();

      for (const teamId of teamIds) {
        teamRosters.set(teamId, []);
        teamBudgets.set(teamId, config.pointLimit);
      }

      for (let round = 0; round < TEAM_ROSTER_SIZE; round++) {
        const order = round % 2 === 0 ? [...teamIds] : [...teamIds].reverse();

        for (const teamId of order) {
          const roster = teamRosters.get(teamId)!;
          const budget = teamBudgets.get(teamId)!;
          const remainingPicks = TEAM_ROSTER_SIZE - roster.length;
          const maxAffordable = budget - (remainingPicks - 1);

          const pickIndex = available.findIndex(sp => (sp.pointValue ?? 0) <= maxAffordable);
          if (pickIndex === -1) continue;

          const pick = available.splice(pickIndex, 1)[0];
          roster.push(pick);
          teamBudgets.set(teamId, budget - (pick.pointValue ?? 0));
        }
      }

      // Create season_pokemon_team assignments
      const rosterAssignments: { seasonPokemonId: number; teamId: number }[] = [];
      for (const [teamId, roster] of teamRosters) {
        seasonPokemonByTeam.set(teamId, roster.map(sp => sp.id));
        for (const sp of roster) {
          rosterAssignments.push({ seasonPokemonId: sp.id, teamId });
        }
      }

      if (rosterAssignments.length > 0) {
        await AppDataSource.createQueryBuilder()
          .insert()
          .into(SeasonPokemonTeam)
          .values(rosterAssignments)
          .execute();
      }
    }

    return seasonPokemonByTeam;
  }

  /**
   * Creates round-robin matches, best-of-3 games, and per-Pokemon game stats.
   * Uses the round-robin schedule to pair teams, randomly determines winners,
   * and generates realistic kill/death distributions for each game.
   */
  private async createMockCompetition(
    weekIdsBySeason: Map<number, number[]>,
    teamIdsBySeason: Map<number, number[]>,
    seasonPokemonByTeam: Map<number, number[]>,
  ): Promise<void> {
    interface MatchMeta {
      teamAId: number;
      teamBId: number;
      winnerId: number;
      loserId: number;
    }

    const matchInserts: { weekId: number; winningTeamId: number; losingTeamId: number }[] = [];
    const matchMetas: MatchMeta[] = [];

    for (const [seasonId, teamIds] of teamIdsBySeason) {
      const weekIds = weekIdsBySeason.get(seasonId);
      if (!weekIds || weekIds.length === 0) continue;

      for (let weekIdx = 0; weekIdx < weekIds.length; weekIdx++) {
        const weekId = weekIds[weekIdx];
        const schedule = roundRobinSchedule[weekIdx];
        if (!schedule) continue;

        for (const [teamAIdx, teamBIdx] of schedule) {
          const teamAId = teamIds[teamAIdx];
          const teamBId = teamIds[teamBIdx];
          const winnerIsA = faker.datatype.boolean();
          const winnerId = winnerIsA ? teamAId : teamBId;
          const loserId = winnerIsA ? teamBId : teamAId;

          matchInserts.push({ weekId, winningTeamId: winnerId, losingTeamId: loserId });
          matchMetas.push({ teamAId, teamBId, winnerId, loserId });
        }
      }
    }

    if (matchInserts.length === 0) return;

    await AppDataSource.createQueryBuilder()
      .insert()
      .into(Match)
      .values(matchInserts)
      .execute();

    const savedMatches = await AppDataSource.getRepository(Match).find({
      select: ['id'],
      order: { id: 'ASC' },
    });

    // Build team_matches join entries and games
    const teamMatchJoins: { team_id: number; match_id: number }[] = [];
    const gameInserts: {
      matchId: number;
      winningTeamId: number;
      losingTeamId: number;
      differential: number;
      replayLink: string;
    }[] = [];

    interface GameMeta {
      winnerId: number;
      loserId: number;
      differential: number;
    }
    const gameMetas: GameMeta[] = [];
    let gameCounter = 1;

    for (let i = 0; i < savedMatches.length; i++) {
      const match = savedMatches[i];
      const meta = matchMetas[i];

      teamMatchJoins.push(
        { team_id: meta.teamAId, match_id: match.id },
        { team_id: meta.teamBId, match_id: match.id },
      );

      // Best of 3: winner wins 2 games, loser wins 0 or 1
      const totalGames = faker.helpers.arrayElement([2, 3]);
      for (let g = 0; g < totalGames; g++) {
        const isLoserWin = totalGames === 3 && g === 0;
        const gameWinnerId = isLoserWin ? meta.loserId : meta.winnerId;
        const gameLoserId = isLoserWin ? meta.winnerId : meta.loserId;
        const differential = faker.number.int({ min: 1, max: 4 });

        gameInserts.push({
          matchId: match.id,
          winningTeamId: gameWinnerId,
          losingTeamId: gameLoserId,
          differential,
          replayLink: `https://replay.pokemonshowdown.com/gen9ou-mock-game-${gameCounter}`,
        });
        gameMetas.push({ winnerId: gameWinnerId, loserId: gameLoserId, differential });
        gameCounter++;
      }
    }

    await this.batchInsertRaw('team_matches', teamMatchJoins);

    await AppDataSource.createQueryBuilder()
      .insert()
      .into(Game)
      .values(gameInserts)
      .execute();

    // Create game stats with realistic kill/death distributions
    const savedGames = await AppDataSource.getRepository(Game).find({
      select: ['id'],
      order: { id: 'ASC' },
    });

    const gameStatInserts: {
      gameId: number;
      seasonPokemonId: number;
      directKills: number;
      indirectKills: number;
      deaths: number;
    }[] = [];

    const PARTY_SIZE = 6;

    for (let i = 0; i < savedGames.length; i++) {
      const game = savedGames[i];
      const meta = gameMetas[i];

      const winnerRoster = seasonPokemonByTeam.get(meta.winnerId);
      const loserRoster = seasonPokemonByTeam.get(meta.loserId);
      if (!winnerRoster || !loserRoster) continue;

      const winnerParty = faker.helpers.arrayElements(
        winnerRoster,
        Math.min(PARTY_SIZE, winnerRoster.length),
      );
      const loserParty = faker.helpers.arrayElements(
        loserRoster,
        Math.min(PARTY_SIZE, loserRoster.length),
      );

      const winnerDeaths = PARTY_SIZE - meta.differential;
      const winnerKills = this.distributeKills(PARTY_SIZE, winnerParty.length);
      const loserKills = this.distributeKills(winnerDeaths, loserParty.length);

      for (let j = 0; j < winnerParty.length; j++) {
        gameStatInserts.push({
          gameId: game.id,
          seasonPokemonId: winnerParty[j],
          directKills: winnerKills[j].directKills,
          indirectKills: winnerKills[j].indirectKills,
          deaths: j < winnerDeaths ? 1 : 0,
        });
      }

      for (let j = 0; j < loserParty.length; j++) {
        gameStatInserts.push({
          gameId: game.id,
          seasonPokemonId: loserParty[j],
          directKills: loserKills[j].directKills,
          indirectKills: loserKills[j].indirectKills,
          deaths: 1,
        });
      }
    }

    if (gameStatInserts.length > 0) {
      await this.batchInsert(GameStat, gameStatInserts);
    }
  }

  /**
   * Distributes a total number of kills randomly across a party of Pokemon.
   * Approximately 75% are direct kills and 25% are indirect kills.
   */
  private distributeKills(
    totalKills: number,
    pokemonCount: number,
  ): { directKills: number; indirectKills: number }[] {
    const stats = Array.from({ length: pokemonCount }, () => ({
      directKills: 0,
      indirectKills: 0,
    }));

    for (let i = 0; i < totalKills; i++) {
      const idx = faker.number.int({ min: 0, max: pokemonCount - 1 });
      if (faker.number.int({ min: 0, max: 3 }) === 0) {
        stats[idx].indirectKills++;
      } else {
        stats[idx].directKills++;
      }
    }

    return stats;
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

    // Overwrite mega Pokemon nat dex moves with their base form's nat dex moves.
    // Megas (e.g., "Charizard-Mega-X") often only exist in earlier gens, so their
    // learnset may be outdated. The base form (e.g., "Charizard") typically exists
    // in later gens with an updated learnset that the mega should inherit.
    const natDexMoveLookup = new Map<string, string[]>();
    for (const [name, data] of natDexMap) {
      natDexMoveLookup.set(name.toLowerCase(), data.moveNames);
    }
    for (const [name, data] of natDexMap) {
      const megaIndex = name.toLowerCase().indexOf('-mega');
      if (megaIndex === -1) continue;

      const baseName = name.substring(0, megaIndex).toLowerCase();
      const baseMoves = natDexMoveLookup.get(baseName);
      if (baseMoves) {
        data.moveNames = baseMoves;
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
