import { Brackets, FindOptionsRelations, FindOptionsWhere, Repository } from 'typeorm';
import { League } from '../entities/league.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { LeagueInputDto } from '../dtos/league.dto';
import { ConflictError } from '../errors';
import { deleteOwnedBlob } from '../utils/blob.utils';
import { PaginatedResponse, PaginationOptions, SortOptions } from '../utils/pagination.utils';
import { hydrateRelations } from '../utils/relation-hydration.utils';
import { Request } from 'express';
import { getQueryIntArray } from '../utils/request.utils';

@Service()
export class LeagueService extends BaseService<League, LeagueInputDto> {
  constructor(
    @Inject('LeagueRepository')
    private leagueRepository: Repository<League>,
  ) {
    super(leagueRepository, 'League');
  }

  async search(
    req: Request,
    relations?: FindOptionsRelations<League>,
    paginationOptions?: PaginationOptions,
    sortOptions?: SortOptions,
  ): Promise<PaginatedResponse<League>> {
    const nameLike = req.query.nameLike as string | undefined;

    const { page, pageSize } = paginationOptions ? paginationOptions : { page: 1, pageSize: 25 };
    const skip = (page - 1) * pageSize;

    // Phase 1: filter/sort/paginate for the page's ids only — no hydration joins
    // (they multiply rows). Phase 2 hydrates relations via separate queries below.
    let queryBuilder = this.repository.createQueryBuilder('league');

    if (nameLike) {
      queryBuilder = queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('league.name ILIKE :nameLike', { nameLike: `%${nameLike}%` }).orWhere(
            'league.abbreviation ILIKE :nameLike',
            { nameLike: `%${nameLike}%` },
          );
        }),
      );
    }

    const ids = getQueryIntArray(req, 'ids');
    if (ids.length > 0) {
      queryBuilder = queryBuilder.andWhere('league.id IN (:...ids)', { ids });
    }

    if (sortOptions) {
      queryBuilder = queryBuilder.orderBy(
        `league.${sortOptions.sortBy}`,
        sortOptions.sortOrder as 'ASC' | 'DESC',
      );
    }

    queryBuilder = queryBuilder.skip(skip).take(pageSize);

    const [rows, total] = await queryBuilder.getManyAndCount();

    const data = relations
      ? await hydrateRelations(this.repository, rows.map((r) => r.id), relations)
      : rows;

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async update(
    where: FindOptionsWhere<League>,
    data: Partial<LeagueInputDto>,
    relations?: FindOptionsRelations<League>,
  ): Promise<League> {
    const oldLogoUrl = data.logoUrl !== undefined ? (await this.findOne(where)).logoUrl : undefined;
    const updated = await super.update(where, data, relations);
    if (oldLogoUrl && oldLogoUrl !== updated.logoUrl) {
      await deleteOwnedBlob(oldLogoUrl);
    }
    return updated;
  }

  async delete(where: FindOptionsWhere<League>): Promise<boolean> {
    const entity = await this.findOne(where, { seasons: true, leagueUsers: true });
    const children: string[] = [];
    if (entity.seasons?.length) children.push('seasons');
    if (entity.leagueUsers?.length) children.push('league users');
    if (children.length > 0) {
      throw new ConflictError(
        `Cannot delete League: it still has ${children.join(' and ')}. Remove them first.`,
      );
    }
    return super.delete(where);
  }
}
