import { Request, Response } from 'express';
import { BaseService } from '../services/base.service';
import { BaseApplicationEntity } from '../entities/base-application-entity.entity';
import { plainToInstance, ClassConstructor } from 'class-transformer';
import { asyncHandler } from '../utils/error.utils';
import { ValidationError } from '../errors';

export abstract class BaseController<T extends BaseApplicationEntity, C> {
  constructor(
    protected readonly service: BaseService<T>,
    protected readonly dtoClass: ClassConstructor<C>
  ) {}

  getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const entities = await this.service.findAll();
    const group = req.query.full === 'true' ? this.getFullTransformGroup() : undefined;

    res.json(
      plainToInstance(this.dtoClass, entities, {
        excludeExtraneousValues: true,
        groups: group,
      })
    );
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError('Invalid ID format');
    }

    const entity = await this.service.findOne(id);
    const group = req.query.full === 'true' ? this.getFullTransformGroup() : undefined;

    res.json(
      plainToInstance(this.dtoClass, entity, {
        excludeExtraneousValues: true,
        groups: group,
      })
    );
  });

  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const entity = await this.service.create(req.body);

    res.status(201).json(
      plainToInstance(this.dtoClass, entity, {
        excludeExtraneousValues: true,
      })
    );
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError('Invalid ID format');
    }

    const entity = await this.service.update(id, req.body);

    res.json(
      plainToInstance(this.dtoClass, entity, {
        excludeExtraneousValues: true,
      })
    );
  });

  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError('Invalid ID format');
    }

    await this.service.delete(id);

    res.status(204).send();
  });

  protected abstract getFullTransformGroup(): string[];
}
