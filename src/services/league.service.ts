import { Brackets, FindOptionsRelations, FindOptionsWhere, Repository } from 'typeorm';
import { League } from '../entities/league.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { LeagueInputDto } from '../dtos/league.dto';
import { ConflictError } from '../errors';
import { PaginatedResponse, PaginationOptions, SortOptions } from '../utils/pagination.utils';
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

    let queryBuilder = this.repository.createQueryBuilder('league');

    if (relations) {
      Object.keys(relations).forEach((relation) => {
        queryBuilder = queryBuilder.leftJoinAndSelect(`league.${relation}`, relation);
      });
    }

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

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
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
