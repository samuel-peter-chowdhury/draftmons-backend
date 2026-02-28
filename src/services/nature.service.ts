import { Repository } from 'typeorm';
import { Nature } from '../entities/nature.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { NatureInputDto } from '../dtos/nature.dto';

@Service()
export class NatureService extends BaseService<Nature, NatureInputDto> {
  constructor(
    @Inject('NatureRepository')
    private NatureRepository: Repository<Nature>,
  ) {
    super(NatureRepository, 'Nature');
  }
}
