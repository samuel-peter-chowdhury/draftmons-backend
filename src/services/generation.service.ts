import { Generation } from '../entities/generation.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { FindOptionsRelations, FindOptionsWhere, Repository } from 'typeorm';
import { GenerationInputDto } from '../dtos/generation.dto';
import { ConflictError } from '../errors';
import { invalidate, referenceListInvalidationPrefix } from '../utils/cache.utils';

@Service()
export class GenerationService extends BaseService<Generation, GenerationInputDto> {
  constructor(
    @Inject('GenerationRepository')
    private GenerationRepository: Repository<Generation>,
  ) {
    super(GenerationRepository, 'Generation');
  }

  // Write-through cache invalidation (see PokemonTypeService for the rationale).
  async create(data: GenerationInputDto): Promise<Generation> {
    const created = await super.create(data);
    await invalidate(referenceListInvalidationPrefix('generation'));
    return created;
  }

  async update(
    where: FindOptionsWhere<Generation>,
    data: Partial<GenerationInputDto>,
    relations?: FindOptionsRelations<Generation>,
  ): Promise<Generation> {
    const updated = await super.update(where, data, relations);
    await invalidate(referenceListInvalidationPrefix('generation'));
    return updated;
  }

  async delete(where: FindOptionsWhere<Generation>): Promise<boolean> {
    const entity = await this.findOne(where, {
      pokemon: true,
      moves: true,
      abilities: true,
      seasons: true,
    });
    const children: string[] = [];
    if (entity.pokemon?.length) children.push('pokemon');
    if (entity.moves?.length) children.push('moves');
    if (entity.abilities?.length) children.push('abilities');
    if (entity.seasons?.length) children.push('seasons');
    if (children.length > 0) {
      throw new ConflictError(
        `Cannot delete Generation: it still has ${children.join(', ')}. Remove them first.`,
      );
    }
    const result = await super.delete(where);
    await invalidate(referenceListInvalidationPrefix('generation'));
    return result;
  }
}
