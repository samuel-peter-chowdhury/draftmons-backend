import { TypeEffective } from "../entities/type-effective.entity";
import { BaseService } from "./base.service";
import { Service, Inject } from 'typedi';
import { Repository } from 'typeorm';
import { TypeEffectiveInputDto } from "../dtos/type-effective.dto";

@Service()
export class TypeEffectiveService extends BaseService<TypeEffective, TypeEffectiveInputDto> {
  constructor(
    @Inject('TypeEffectiveRepository')
    private TypeEffectiveRepository: Repository<TypeEffective>
  ) {
    super(TypeEffectiveRepository, 'TypeEffective');
  }
}
