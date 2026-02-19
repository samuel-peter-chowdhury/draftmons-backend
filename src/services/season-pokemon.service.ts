import { SeasonPokemon } from '../entities/season-pokemon.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { FindOptionsWhere, Repository } from 'typeorm';
import { SeasonPokemonInputDto } from '../dtos/season-pokemon.dto';
import { ConflictError } from '../errors';

@Service()
export class SeasonPokemonService extends BaseService<SeasonPokemon, SeasonPokemonInputDto> {
  constructor(
    @Inject('SeasonPokemonRepository')
    private SeasonPokemonRepository: Repository<SeasonPokemon>,
  ) {
    super(SeasonPokemonRepository, 'SeasonPokemon');
  }

  async delete(where: FindOptionsWhere<SeasonPokemon>): Promise<boolean> {
    const entity = await this.findOne(where, { seasonPokemonTeams: true, gameStats: true });
    const children: string[] = [];
    if (entity.seasonPokemonTeams?.length) children.push('team assignments');
    if (entity.gameStats?.length) children.push('game stats');
    if (children.length > 0) {
      throw new ConflictError(
        `Cannot delete Season Pokemon: it still has ${children.join(' and ')}. Remove them first.`,
      );
    }
    return super.delete(where);
  }
}
