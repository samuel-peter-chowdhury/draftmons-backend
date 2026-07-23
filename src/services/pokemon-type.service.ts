import { PokemonType } from '../entities/pokemon-type.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { FindOptionsRelations, FindOptionsWhere, Repository } from 'typeorm';
import { PokemonTypeInputDto } from '../dtos/pokemon-type.dto';
import { ConflictError } from '../errors';
import { invalidate, referenceListInvalidationPrefix } from '../utils/cache.utils';

@Service()
export class PokemonTypeService extends BaseService<PokemonType, PokemonTypeInputDto> {
  constructor(
    @Inject('PokemonTypeRepository')
    private PokemonTypeRepository: Repository<PokemonType>,
  ) {
    super(PokemonTypeRepository, 'PokemonType');
  }

  // Write-through cache invalidation: any create/update/delete clears the cached base list
  // so the very next GET reflects the change (not TTL-dependent).
  async create(data: PokemonTypeInputDto): Promise<PokemonType> {
    const created = await super.create(data);
    await invalidate(referenceListInvalidationPrefix('pokemon-type'));
    return created;
  }

  async update(
    where: FindOptionsWhere<PokemonType>,
    data: Partial<PokemonTypeInputDto>,
    relations?: FindOptionsRelations<PokemonType>,
  ): Promise<PokemonType> {
    const updated = await super.update(where, data, relations);
    await invalidate(referenceListInvalidationPrefix('pokemon-type'));
    return updated;
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
    const result = await super.delete(where);
    await invalidate(referenceListInvalidationPrefix('pokemon-type'));
    return result;
  }
}
