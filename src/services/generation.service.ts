import { Generation } from '../entities/generation.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { Repository } from 'typeorm';
import { GenerationInputDto } from '../dtos/generation.dto';

@Service()
export class GenerationService extends BaseService<Generation, GenerationInputDto> {
  constructor(
    @Inject('GenerationRepository')
    private GenerationRepository: Repository<Generation>,
  ) {
    super(GenerationRepository, 'Generation');
  }
}
