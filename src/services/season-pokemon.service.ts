import { SeasonPokemon } from '../entities/season-pokemon.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { FindOptionsOrder, FindOptionsRelations, FindOptionsWhere, Repository } from 'typeorm';
import { SeasonPokemonInputDto } from '../dtos/season-pokemon.dto';
import { ConflictError } from '../errors';
import { PaginatedResponse, PaginationOptions, SortOptions } from '@/utils/pagination.utils';

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

  async findAll(
    where?: FindOptionsWhere<SeasonPokemon> | FindOptionsWhere<SeasonPokemon>[],
    relations?: FindOptionsRelations<SeasonPokemon>,
    paginationOptions?: PaginationOptions,
    sortOptions?: SortOptions,
  ): Promise<PaginatedResponse<SeasonPokemon>> {
    let order: FindOptionsOrder<SeasonPokemon> | undefined;
    const sortBy = sortOptions?.sortBy;
    if (sortOptions?.sortBy === 'name'){
      order = {pokemon: {name: sortOptions.sortOrder}} as FindOptionsOrder<SeasonPokemon>;
    } else {
      order = sortOptions ? ({ [sortOptions.sortBy]: sortOptions.sortOrder } as FindOptionsOrder<SeasonPokemon>) : undefined;
    }

    const { page, pageSize } = paginationOptions ? paginationOptions : { page: 1, pageSize: 25 };
    const skip = (page - 1) * pageSize;

    const [data, total] = await this.repository.findAndCount({
      where: where,
      relations: relations,
      skip: skip,
      take: pageSize,
      order: order,
    });

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } 
}
