import { Season } from '../entities/season.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { Repository } from 'typeorm';
import { SeasonInputDto } from '../dtos/season.dto';

@Service()
export class SeasonService extends BaseService<Season, SeasonInputDto> {
  constructor(
    @Inject('SeasonRepository')
    private SeasonRepository: Repository<Season>,
  ) {
    super(SeasonRepository, 'Season');
  }
}
