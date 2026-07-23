import { Brackets, FindOptionsRelations, FindOptionsWhere, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { UserInputDto } from '../dtos/user.dto';
import { deleteOwnedBlob } from '../utils/blob.utils';
import { PaginatedResponse, PaginationOptions, SortOptions } from '../utils/pagination.utils';
import { hydrateRelations } from '../utils/relation-hydration.utils';
import { Request } from 'express';

@Service()
export class UserService extends BaseService<User, UserInputDto> {
  private static readonly ALLOWED_SORT_FIELDS = new Set([
    'id', 'firstName', 'lastName', 'email', 'createdAt', 'updatedAt',
  ]);

  constructor(
    @Inject('UserRepository')
    private userRepository: Repository<User>,
  ) {
    super(userRepository, 'User');
  }

  async update(
    where: FindOptionsWhere<User>,
    data: Partial<UserInputDto>,
    relations?: FindOptionsRelations<User>,
  ): Promise<User> {
    const oldAvatarUrl =
      data.avatarUrl !== undefined ? (await this.findOne(where)).avatarUrl : undefined;
    const updated = await super.update(where, data, relations);
    if (oldAvatarUrl && oldAvatarUrl !== updated.avatarUrl) {
      await deleteOwnedBlob(oldAvatarUrl);
    }
    return updated;
  }

  async search(
    req: Request,
    relations?: FindOptionsRelations<User>,
    paginationOptions?: PaginationOptions,
    sortOptions?: SortOptions,
  ): Promise<PaginatedResponse<User>> {
    const nameLike = req.query.nameLike as string | undefined;

    const { page, pageSize } = paginationOptions ? paginationOptions : { page: 1, pageSize: 25 };
    const skip = (page - 1) * pageSize;

    // Phase 1: filter/sort/paginate for the page's ids only — no hydration joins
    // (they multiply rows). Phase 2 hydrates relations via separate queries below.
    let queryBuilder = this.repository.createQueryBuilder('user');

    // Add the name and email search conditions only if nameLike is provided
    if (nameLike) {
      queryBuilder = queryBuilder.where(
        new Brackets((qb) => {
          qb.where('user.firstName ILIKE :nameLike', { nameLike: `%${nameLike}%` })
            .orWhere('user.lastName ILIKE :nameLike', { nameLike: `%${nameLike}%` })
            .orWhere("CONCAT(user.firstName, ' ', user.lastName) ILIKE :nameLike", {
              nameLike: `%${nameLike}%`,
            })
            .orWhere('user.email ILIKE :nameLike', { nameLike: `%${nameLike}%` });
        }),
      );
    }

    // Add sorting if provided (validate against allowlist)
    if (sortOptions) {
      if (!UserService.ALLOWED_SORT_FIELDS.has(sortOptions.sortBy)) {
        throw new Error(`Invalid sort field: ${sortOptions.sortBy}`);
      }
      queryBuilder = queryBuilder.orderBy(
        `user.${sortOptions.sortBy}`,
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
}
