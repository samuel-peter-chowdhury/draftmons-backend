import { Request, Response } from 'express';
import { BaseService } from '../services/base.service';
import { BaseApplicationEntity } from '../entities/base-application.entity';
import { plainToInstance, ClassConstructor } from 'class-transformer';
import { asyncHandler } from '../utils/error.utils';
import { ValidationError as AppValidationError } from '../errors';
import { BaseOutputDto, BaseInputDto } from '../dtos/base.dto';
import { PaginationOptions, SortOptions } from '../utils/pagination.utils';
import { FindOptionsRelations, FindOptionsWhere } from 'typeorm';
import { validate, ValidationError } from 'class-validator';
import { formatValidationErrors } from '../middleware/validation.middleware';

export abstract class BaseController<
  E extends BaseApplicationEntity,
  I extends BaseInputDto,
  O extends BaseOutputDto,
> {
  constructor(
    protected readonly service: BaseService<E, I>,
    protected readonly outputDtoClass: ClassConstructor<O>,
  ) {}

  getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const isFull = req.query.full === 'true';
    const where = await this.getWhere(req);
    const relations = isFull ? this.getFullRelations() : this.getBaseRelations();
    const paginationOptions = await this.getPaginationOptions(req);
    const sortOptions = await this.getSortOptions(req);
    const group = isFull ? this.getFullTransformGroup() : undefined;

    const paginatedEntities = await this.service.findAll(
      where,
      relations,
      paginationOptions,
      sortOptions,
    );

    const response = {
      data: plainToInstance(this.outputDtoClass, paginatedEntities.data, {
        groups: group,
        excludeExtraneousValues: true,
      }),
      total: paginatedEntities.total,
      page: paginatedEntities.page,
      pageSize: paginatedEntities.pageSize,
      totalPages: paginatedEntities.totalPages,
    };
    res.json(response);
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new AppValidationError('Invalid ID format');
    }

    const isFull = req.query.full === 'true';
    const where = { id } as FindOptionsWhere<E>;
    const relations = isFull ? this.getFullRelations() : this.getBaseRelations();
    const group = isFull ? this.getFullTransformGroup() : undefined;

    const entity = await this.service.findOne(where, relations);

    res.json(
      plainToInstance(this.outputDtoClass, entity, {
        groups: group,
        excludeExtraneousValues: true,
      }),
    );
  });

  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const entity = await this.service.create(req.body);

    res.status(201).json(
      plainToInstance(this.outputDtoClass, entity, {
        excludeExtraneousValues: true,
      }),
    );
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new AppValidationError('Invalid ID format');
    }

    const isFull = req.query.full === 'true';
    const where = { id } as FindOptionsWhere<E>;
    const relations = isFull ? this.getFullRelations() : this.getBaseRelations();
    const group = isFull ? this.getFullTransformGroup() : undefined;

    const entity = await this.service.update(where, req.body, relations);

    res.json(
      plainToInstance(this.outputDtoClass, entity, {
        groups: group,
        excludeExtraneousValues: true,
      }),
    );
  });

  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new AppValidationError('Invalid ID format');
    }

    const where = { id } as FindOptionsWhere<E>;

    await this.service.delete(where);

    res.status(204).send();
  });

  protected async getPaginationOptions(req: Request): Promise<PaginationOptions> {
    const page: number = parseInt(req.query.page as string) || 1;
    const pageSize: number = parseInt(req.query.pageSize as string) || 25;
    const paginationOptions: PaginationOptions = plainToInstance(PaginationOptions, {
      page,
      pageSize,
    });
    const errors: ValidationError[] = await validate(paginationOptions, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length > 0) {
      throw new AppValidationError(formatValidationErrors(errors));
    }
    return paginationOptions;
  }

  protected async getSortOptions(req: Request): Promise<SortOptions | undefined> {
    if (req.query.sortBy) {
      const sortBy: string = req.query.sortBy as string;
      const sortOrder: string = (req.query.sortOrder as string) || 'ASC';

      const allowedFields = this.getAllowedSortFields();
      if (!allowedFields.includes(sortBy)) {
        throw new AppValidationError(
          `Invalid sortBy field '${sortBy}'. Allowed fields: ${allowedFields.join(', ')}`,
        );
      }

      const sortOptions: SortOptions = plainToInstance(SortOptions, {
        sortBy,
        sortOrder,
      });
      const errors: ValidationError[] = await validate(sortOptions, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });
      if (errors.length > 0) {
        throw new AppValidationError(formatValidationErrors(errors));
      }
      return sortOptions;
    } else {
      return undefined;
    }
  }

  protected abstract getWhere(
    req: Request,
  ): Promise<FindOptionsWhere<E> | FindOptionsWhere<E>[] | undefined>;

  protected abstract getBaseRelations(): FindOptionsRelations<E> | undefined;

  protected abstract getFullRelations(): FindOptionsRelations<E> | undefined;

  protected abstract getFullTransformGroup(): string[];

  protected abstract getAllowedSortFields(): string[];
}
