import { SpecialMoveCategoryInputDto } from '../dtos/special-move-category.dto';
import { SpecialMoveCategory } from '../entities/special-move-category.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { Repository } from 'typeorm';

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
}
