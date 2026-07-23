import { SpecialMoveCategoryInputDto } from '../dtos/special-move-category.dto';
import { SpecialMoveCategory } from '../entities/special-move-category.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { FindOptionsRelations, FindOptionsWhere, Repository } from 'typeorm';
import { invalidate, referenceListInvalidationPrefix } from '../utils/cache.utils';

@Service()
export class SpecialMoveCategoryService extends BaseService<
  SpecialMoveCategory,
  SpecialMoveCategoryInputDto
> {
  constructor(
    @Inject('SpecialMoveCategoryRepository')
    private SpecialMoveCategoryRepository: Repository<SpecialMoveCategory>,
  ) {
    super(SpecialMoveCategoryRepository, 'SpecialMoveCategory');
  }

  // Write-through cache invalidation (see PokemonTypeService for the rationale).
  async create(data: SpecialMoveCategoryInputDto): Promise<SpecialMoveCategory> {
    const created = await super.create(data);
    await invalidate(referenceListInvalidationPrefix('special-move-category'));
    return created;
  }

  async update(
    where: FindOptionsWhere<SpecialMoveCategory>,
    data: Partial<SpecialMoveCategoryInputDto>,
    relations?: FindOptionsRelations<SpecialMoveCategory>,
  ): Promise<SpecialMoveCategory> {
    const updated = await super.update(where, data, relations);
    await invalidate(referenceListInvalidationPrefix('special-move-category'));
    return updated;
  }

  async delete(where: FindOptionsWhere<SpecialMoveCategory>): Promise<boolean> {
    const result = await super.delete(where);
    await invalidate(referenceListInvalidationPrefix('special-move-category'));
    return result;
  }
}
