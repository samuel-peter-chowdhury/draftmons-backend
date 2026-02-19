import { Week } from '../entities/week.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { FindOptionsWhere, Repository } from 'typeorm';
import { WeekInputDto } from '../dtos/week.dto';
import { ConflictError } from '../errors';

@Service()
export class WeekService extends BaseService<Week, WeekInputDto> {
  constructor(
    @Inject('WeekRepository')
    private WeekRepository: Repository<Week>,
  ) {
    super(WeekRepository, 'Week');
  }

  async delete(where: FindOptionsWhere<Week>): Promise<boolean> {
    const entity = await this.findOne(where, { matches: true });
    if (entity.matches?.length) {
      throw new ConflictError(
        'Cannot delete Week: it still has matches. Remove them first.',
      );
    }
    return super.delete(where);
  }
}
