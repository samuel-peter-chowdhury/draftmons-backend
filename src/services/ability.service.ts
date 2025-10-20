import { Ability } from '../entities/ability.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { Repository } from 'typeorm';
import { AbilityInputDto } from '../dtos/ability.dto';

@Service()
export class AbilityService extends BaseService<Ability, AbilityInputDto> {
  constructor(
    @Inject('AbilityRepository')
    private AbilityRepository: Repository<Ability>,
  ) {
    super(AbilityRepository, 'Ability');
  }
}
