import { Generation } from '../entities/generation.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { FindOptionsWhere, Repository } from 'typeorm';
import { GenerationInputDto } from '../dtos/generation.dto';
import { ConflictError } from '../errors';

@Service()
export class GenerationService extends BaseService<Generation, GenerationInputDto> {
  constructor(
    @Inject('GenerationRepository')
    private GenerationRepository: Repository<Generation>,
  ) {
    super(GenerationRepository, 'Generation');
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
    return super.delete(where);
  }
}
