import { Request, Response } from 'express';
import { plainToInstance, ClassConstructor } from 'class-transformer';
import { asyncHandler } from '../utils/error.utils';
import { BaseService } from '../services/base.service';
import { BaseApplicationEntity } from '@/entities/base.entity';

export abstract class BaseController<T extends BaseApplicationEntity, C, U> {
  protected service: BaseService<T>;
  protected dtoClass: ClassConstructor<C>;

  constructor(service: BaseService<T>, dtoClass: ClassConstructor<C>) {
    this.service = service;
    this.dtoClass = dtoClass;
  }

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
    const entity = await this.service.update(id, req.body);

    res.json(
      plainToInstance(this.dtoClass, entity, {
        excludeExtraneousValues: true,
      })
    );
  });

  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    await this.service.delete(id);

    res.status(204).send();
  });

  // Override in child classes to specify the full transform group
  protected getFullTransformGroup(): string[] {
    return [];
  }
}
