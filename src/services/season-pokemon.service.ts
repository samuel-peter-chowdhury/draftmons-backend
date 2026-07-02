import { SeasonPokemon } from '../entities/season-pokemon.entity';
import { Season } from '../entities/season.entity';
import { Pokemon } from '../entities/pokemon.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { FindOptionsRelations, FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { SeasonPokemonInputDto } from '../dtos/season-pokemon.dto';
import {
  BulkUpsertEntryResultDto,
  BulkUpsertEntryStatus,
  BulkUpsertErrorCode,
  BulkUpsertInputDto,
} from '../dtos/season-pokemon-bulk.dto';
import { ConflictError, ForbiddenError, NotFoundError } from '../errors';
import { PaginatedResponse, PaginationOptions, SortOptions } from '../utils/pagination.utils';
import {
  SeasonPokemonSearchFilters,
  applySeasonPokemonSearchFilters,
  applySearchSorting,
  applySearchPagination,
  SEASON_POKEMON_SORT_FIELD_MAP,
} from '../utils/pokemon-search.utils';
import AppDataSource from '../config/database.config';

@Service()
export class SeasonPokemonService extends BaseService<SeasonPokemon, SeasonPokemonInputDto> {
  constructor(
    @Inject('SeasonPokemonRepository')
    private SeasonPokemonRepository: Repository<SeasonPokemon>,
    @Inject('SeasonRepository')
    private seasonRepository: Repository<Season>,
    @Inject('PokemonRepository')
    private pokemonRepository: Repository<Pokemon>,
  ) {
    super(SeasonPokemonRepository, 'SeasonPokemon');
  }

  /**
   * Creates-or-updates many SeasonPokemon rows in a single transaction,
   * validating each entry independently so one bad row never blocks the
   * others (API-01, API-02). Restricted server-side to the season's own
   * league (API-03 / T-06-01), independent of route-level authorization.
   */
  async bulkUpsert(
    leagueId: number,
    dto: BulkUpsertInputDto,
  ): Promise<BulkUpsertEntryResultDto[]> {
    const season = await this.seasonRepository.findOne({ where: { id: dto.seasonId } });
    if (!season) {
      throw new NotFoundError('Season', dto.seasonId);
    }

    // Cross-league authorization (T-06-01): the route's :leagueId authorizes
    // the caller as a moderator of that league only. The season must belong
    // to it, otherwise a league-A moderator could write to a league-B tier
    // list by passing a league-B seasonId in the body.
    if (season.leagueId !== leagueId) {
      throw new ForbiddenError(`Season ${dto.seasonId} does not belong to league ${leagueId}`);
    }

    // ---- VALIDATION PASS (accumulate, never throw for per-entry issues) ----
    const results: BulkUpsertEntryResultDto[] = [];
    // pokemonId -> pointValue to persist; later entries overwrite earlier
    // ones so "last one wins" for duplicate names (D-07).
    const toPersist = new Map<number, number>();

    for (const entry of dto.entries) {
      const result = new BulkUpsertEntryResultDto();
      result.name = entry.name;
      result.pointValue = entry.pointValue;

      const pokemon = await this.pokemonRepository
        .createQueryBuilder('pokemon')
        .where('LOWER(pokemon.name) = LOWER(:name)', { name: entry.name.trim() })
        .andWhere('pokemon.generationId = :generationId', { generationId: season.generationId })
        .getOne();

      if (!pokemon) {
        result.status = BulkUpsertEntryStatus.FAILURE;
        result.code = BulkUpsertErrorCode.POKEMON_NOT_FOUND;
        result.message = `Pokémon "${entry.name}" was not found in this season's generation.`;
        results.push(result);
        continue;
      }

      const pointValue = entry.pointValue;
      const isValidPointValue =
        pointValue !== undefined &&
        pointValue !== null &&
        Number.isInteger(pointValue) &&
        pointValue >= 0 &&
        pointValue <= season.maxPointValue;

      if (!isValidPointValue) {
        result.status = BulkUpsertEntryStatus.FAILURE;
        result.code = BulkUpsertErrorCode.INVALID_POINT_VALUE;
        result.message = `pointValue must be an integer between 0 and ${season.maxPointValue} (got ${pointValue}).`;
        results.push(result);
        continue;
      }

      result.status = BulkUpsertEntryStatus.SUCCESS;
      results.push(result);

      // D-07/D-07b: dedup happens AFTER validation, keyed by resolved
      // pokemonId — every valid occurrence still reports success above,
      // but only the LAST valid occurrence's pointValue gets persisted.
      toPersist.set(pokemon.id, pointValue as number);
    }

    // ---- PERSIST in one transaction (API-01) ----
    await AppDataSource.transaction(async (manager) => {
      const repo = manager.getRepository(SeasonPokemon);

      for (const [pokemonId, pointValue] of toPersist.entries()) {
        const existing = await repo.findOne({
          where: { seasonId: dto.seasonId, pokemonId },
        });

        if (existing) {
          existing.pointValue = pointValue;
          await repo.save(existing);
        } else {
          const created = repo.create({
            seasonId: dto.seasonId,
            pokemonId,
            pointValue,
          });
          await repo.save(created);
        }
      }
    });

    return results;
  }

  async delete(where: FindOptionsWhere<SeasonPokemon>): Promise<boolean> {
    const entity = await this.findOne(where, { seasonPokemonTeams: true, gameStats: true });
    const children: string[] = [];
    if (entity.seasonPokemonTeams?.length) children.push('team assignments');
    if (entity.gameStats?.length) children.push('game stats');
    if (children.length > 0) {
      throw new ConflictError(
        `Cannot delete Season Pokemon: it still has ${children.join(' and ')}. Remove them first.`,
      );
    }
    return super.delete(where);
  }

  async search(
    filters: SeasonPokemonSearchFilters,
    loadFullRelations: boolean,
    activeRelationsOnly: boolean,
    paginationOptions?: PaginationOptions,
    sortOptions?: SortOptions,
  ): Promise<PaginatedResponse<SeasonPokemon>> {
    const { page, pageSize } = paginationOptions ?? { page: 1, pageSize: 25 };

    let qb = this.buildQueryBuilder(
      loadFullRelations,
      activeRelationsOnly,
      filters.teamId !== undefined,
    );

    qb = applySeasonPokemonSearchFilters(qb, filters);
    qb = applySearchSorting(qb, sortOptions, SEASON_POKEMON_SORT_FIELD_MAP);
    qb = applySearchPagination(qb, page, pageSize);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(
    where: FindOptionsWhere<SeasonPokemon>,
    relations?: FindOptionsRelations<SeasonPokemon>,
    activeRelationsOnly?: boolean,
  ): Promise<SeasonPokemon> {
    if (!activeRelationsOnly) {
      return super.findOne(where, relations);
    }

    const qb = this.buildQueryBuilder(true, true);
    const whereRecord = where as Record<string, unknown>;

    if (whereRecord.id !== undefined) {
      qb.andWhere('seasonPokemon.id = :id', { id: whereRecord.id });
    }
    if (whereRecord.seasonId !== undefined) {
      qb.andWhere('seasonPokemon.seasonId = :seasonId', { seasonId: whereRecord.seasonId });
    }
    if (whereRecord.pokemonId !== undefined) {
      qb.andWhere('seasonPokemon.pokemonId = :pokemonId', { pokemonId: whereRecord.pokemonId });
    }

    const entity = await qb.getOne();

    if (!entity) {
      throw new NotFoundError(this.entityName, JSON.stringify(where));
    }

    return entity;
  }

  private buildQueryBuilder(
    loadFullRelations: boolean,
    activeRelationsOnly: boolean,
    needsTeamJoin?: boolean,
  ): SelectQueryBuilder<SeasonPokemon> {
    const qb = this.repository
      .createQueryBuilder('seasonPokemon')
      .leftJoinAndSelect('seasonPokemon.pokemon', 'pokemon');

    if (loadFullRelations) {
      qb.leftJoinAndSelect('seasonPokemon.season', 'season')
        .leftJoinAndSelect('pokemon.pokemonTypes', 'pokemonType')
        .leftJoinAndSelect('pokemon.abilities', 'ability')
        .leftJoinAndSelect('pokemon.generation', 'generation')
        .leftJoinAndSelect('seasonPokemon.gameStats', 'gameStat');

      if (activeRelationsOnly) {
        qb.leftJoinAndSelect(
          'seasonPokemon.seasonPokemonTeams',
          'seasonPokemonTeam',
          'seasonPokemonTeam.isActive = :sptActive',
          { sptActive: true },
        ).leftJoinAndSelect('seasonPokemonTeam.team', 'team');
      } else {
        qb.leftJoinAndSelect(
          'seasonPokemon.seasonPokemonTeams',
          'seasonPokemonTeam',
        ).leftJoinAndSelect('seasonPokemonTeam.team', 'team');
      }
    } else if (needsTeamJoin) {
      if (activeRelationsOnly) {
        qb.leftJoin(
          'seasonPokemon.seasonPokemonTeams',
          'seasonPokemonTeam',
          'seasonPokemonTeam.isActive = :sptActive',
          { sptActive: true },
        );
      } else {
        qb.leftJoin('seasonPokemon.seasonPokemonTeams', 'seasonPokemonTeam');
      }
    }

    return qb;
  }
}
