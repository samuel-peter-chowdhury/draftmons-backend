import { PokemonType } from '../entities/pokemon-type.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { FindOptionsWhere, Repository } from 'typeorm';
import { PokemonTypeInputDto } from '../dtos/pokemon-type.dto';
import { ConflictError } from '../errors';

@Service()
export class PokemonTypeService extends BaseService<PokemonType, PokemonTypeInputDto> {
  constructor(
    @Inject('PokemonTypeRepository')
    private PokemonTypeRepository: Repository<PokemonType>,
  ) {
    super(PokemonTypeRepository, 'PokemonType');
  }

  async delete(where: FindOptionsWhere<PokemonType>): Promise<boolean> {
    const entity = await this.findOne(where, { moves: true, typeEffectiveness: true });
    const children: string[] = [];
    if (entity.moves?.length) children.push('moves');
    if (entity.typeEffectiveness?.length) children.push('type effectiveness entries');
    if (children.length > 0) {
      throw new ConflictError(
        `Cannot delete Pokemon Type: it still has ${children.join(' and ')}. Remove them first.`,
      );
    }
    return super.delete(where);
  }
}
