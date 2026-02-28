import { TeamBuildSet } from '../entities/team-build-set.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { FindOptionsRelations, FindOptionsWhere, Repository } from 'typeorm';
import { TeamBuildSetInputDto } from '../dtos/team-build-set.dto';
import { ValidationError } from '../errors';
import { TeamBuild } from '../entities/team-build.entity';
import { Pokemon } from '../entities/pokemon.entity';
import { Item } from '../entities/item.entity';

@Service()
export class TeamBuildSetService extends BaseService<TeamBuildSet, TeamBuildSetInputDto> {
  constructor(
    @Inject('TeamBuildSetRepository')
    private teamBuildSetRepository: Repository<TeamBuildSet>,
    @Inject('TeamBuildRepository')
    private teamBuildRepository: Repository<TeamBuild>,
    @Inject('PokemonRepository')
    private pokemonRepository: Repository<Pokemon>,
    @Inject('ItemRepository')
    private itemRepository: Repository<Item>,
  ) {
    super(teamBuildSetRepository, 'TeamBuildSet');
  }

  private async validateSet(
    teamBuildId: number,
    pokemonId: number,
    itemId?: number | null,
    abilityId?: number | null,
    move1Id?: number | null,
    move2Id?: number | null,
    move3Id?: number | null,
    move4Id?: number | null,
  ): Promise<void> {
    // 1. Load the parent TeamBuild to get generationId
    const teamBuild = await this.teamBuildRepository.findOne({
      where: { id: teamBuildId },
    });
    if (!teamBuild) {
      throw new ValidationError(`TeamBuild with id ${teamBuildId} not found`);
    }

    // 2. Load the Pokemon with its abilities and moves for validation
    const pokemon = await this.pokemonRepository.findOne({
      where: { id: pokemonId },
      relations: { abilities: true, moves: true },
    });
    if (!pokemon) {
      throw new ValidationError(`Pokemon with id ${pokemonId} not found`);
    }

    // 3. Check Pokemon generation matches TeamBuild generation
    if (pokemon.generationId !== teamBuild.generationId) {
      throw new ValidationError(
        `Pokemon generation (${pokemon.generationId}) does not match team build generation (${teamBuild.generationId})`,
      );
    }

    // 4. Check Item generation matches TeamBuild generation (if provided)
    if (itemId != null) {
      const item = await this.itemRepository.findOne({
        where: { id: itemId },
      });
      if (!item) {
        throw new ValidationError(`Item with id ${itemId} not found`);
      }
      if (item.generationId !== teamBuild.generationId) {
        throw new ValidationError(
          `Item generation (${item.generationId}) does not match team build generation (${teamBuild.generationId})`,
        );
      }
    }

    // 5. Check Ability is in Pokemon's abilities list (if provided)
    if (abilityId != null) {
      const pokemonAbilityIds = pokemon.abilities.map((a) => a.id);
      if (!pokemonAbilityIds.includes(abilityId)) {
        throw new ValidationError(
          `Ability with id ${abilityId} is not in ${pokemon.name}'s abilities list`,
        );
      }
    }

    // 6. Check all Moves are in Pokemon's moves list (if provided)
    const pokemonMoveIds = pokemon.moves.map((m) => m.id);
    const moveIds = [move1Id, move2Id, move3Id, move4Id].filter(
      (id): id is number => id != null,
    );
    for (const moveId of moveIds) {
      if (!pokemonMoveIds.includes(moveId)) {
        throw new ValidationError(
          `Move with id ${moveId} is not in ${pokemon.name}'s moves list`,
        );
      }
    }
  }

  async create(data: TeamBuildSetInputDto): Promise<TeamBuildSet> {
    await this.validateSet(
      data.teamBuildId,
      data.pokemonId,
      data.itemId,
      data.abilityId,
      data.move1Id,
      data.move2Id,
      data.move3Id,
      data.move4Id,
    );
    return super.create(data);
  }

  async update(
    where: FindOptionsWhere<TeamBuildSet>,
    data: Partial<TeamBuildSetInputDto>,
    relations?: FindOptionsRelations<TeamBuildSet>,
  ): Promise<TeamBuildSet> {
    // Load existing to merge with partial update data
    const existing = await this.findOne(where);
    const finalTeamBuildId = data.teamBuildId ?? existing.teamBuildId;
    const finalPokemonId = data.pokemonId ?? existing.pokemonId;
    const finalItemId = data.itemId !== undefined ? data.itemId : existing.itemId;
    const finalAbilityId = data.abilityId !== undefined ? data.abilityId : existing.abilityId;
    const finalMove1Id = data.move1Id !== undefined ? data.move1Id : existing.move1Id;
    const finalMove2Id = data.move2Id !== undefined ? data.move2Id : existing.move2Id;
    const finalMove3Id = data.move3Id !== undefined ? data.move3Id : existing.move3Id;
    const finalMove4Id = data.move4Id !== undefined ? data.move4Id : existing.move4Id;

    await this.validateSet(
      finalTeamBuildId,
      finalPokemonId,
      finalItemId,
      finalAbilityId,
      finalMove1Id,
      finalMove2Id,
      finalMove3Id,
      finalMove4Id,
    );

    await this.repository.update(where, data as any);
    return this.findOne(where, relations);
  }
}
