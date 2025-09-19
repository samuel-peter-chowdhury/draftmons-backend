import { PokemonType } from "../entities/pokemon-type.entity";
import { BaseService } from "./base.service";
import { Service, Inject } from 'typedi';
import { Repository } from 'typeorm';
import { PokemonTypeInputDto } from "../dtos/pokemon-type.dto";

@Service()
export class PokemonTypeService extends BaseService<PokemonType, PokemonTypeInputDto> {
  constructor(
    @Inject('PokemonTypeRepository')
    private PokemonTypeRepository: Repository<PokemonType>
  ) {
    super(PokemonTypeRepository, 'PokemonType');
  }
}
