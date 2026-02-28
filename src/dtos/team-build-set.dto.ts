import { Expose, Type } from 'class-transformer';
import { BaseOutputDto, BaseInputDto } from './base.dto';
import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { TeamBuildOutputDto } from './team-build.dto';
import { PokemonOutputDto } from './pokemon.dto';
import { ItemOutputDto } from './item.dto';
import { AbilityOutputDto } from './ability.dto';
import { MoveOutputDto } from './move.dto';
import { NatureOutputDto } from './nature.dto';

export class TeamBuildSetOutputDto extends BaseOutputDto {
  @Expose()
  teamBuildId: number;

  @Expose()
  pokemonId: number;

  @Expose()
  pointValue: number;

  @Expose()
  condition: string;

  @Expose()
  itemId: number;

  @Expose()
  abilityId: number;

  @Expose()
  move1Id: number;

  @Expose()
  move2Id: number;

  @Expose()
  move3Id: number;

  @Expose()
  move4Id: number;

  @Expose()
  hpEv: number;

  @Expose()
  attackEv: number;

  @Expose()
  defenseEv: number;

  @Expose()
  specialAttackEv: number;

  @Expose()
  specialDefenseEv: number;

  @Expose()
  speedEv: number;

  @Expose()
  hpIv: number;

  @Expose()
  attackIv: number;

  @Expose()
  defenseIv: number;

  @Expose()
  specialAttackIv: number;

  @Expose()
  specialDefenseIv: number;

  @Expose()
  speedIv: number;

  @Expose()
  natureId: number;

  @Expose({ groups: ['teamBuildSet.full'] })
  @Type(() => TeamBuildOutputDto)
  teamBuild: TeamBuildOutputDto;

  @Expose({ groups: ['teamBuildSet.full', 'teamBuild.full'] })
  @Type(() => PokemonOutputDto)
  pokemon: PokemonOutputDto;

  @Expose({ groups: ['teamBuildSet.full', 'teamBuild.full'] })
  @Type(() => ItemOutputDto)
  item: ItemOutputDto;

  @Expose({ groups: ['teamBuildSet.full', 'teamBuild.full'] })
  @Type(() => AbilityOutputDto)
  ability: AbilityOutputDto;

  @Expose({ groups: ['teamBuildSet.full', 'teamBuild.full'] })
  @Type(() => MoveOutputDto)
  move1: MoveOutputDto;

  @Expose({ groups: ['teamBuildSet.full', 'teamBuild.full'] })
  @Type(() => MoveOutputDto)
  move2: MoveOutputDto;

  @Expose({ groups: ['teamBuildSet.full', 'teamBuild.full'] })
  @Type(() => MoveOutputDto)
  move3: MoveOutputDto;

  @Expose({ groups: ['teamBuildSet.full', 'teamBuild.full'] })
  @Type(() => MoveOutputDto)
  move4: MoveOutputDto;

  @Expose({ groups: ['teamBuildSet.full', 'teamBuild.full'] })
  @Type(() => NatureOutputDto)
  nature: NatureOutputDto;
}

export class TeamBuildSetInputDto extends BaseInputDto {
  @Expose()
  @IsNumber()
  teamBuildId: number;

  @Expose()
  @IsNumber()
  pokemonId: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  pointValue: number;

  @Expose()
  @IsOptional()
  @IsString()
  condition: string;

  @Expose()
  @IsOptional()
  @IsNumber()
  itemId: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  abilityId: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  move1Id: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  move2Id: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  move3Id: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  move4Id: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(252)
  hpEv: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(252)
  attackEv: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(252)
  defenseEv: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(252)
  specialAttackEv: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(252)
  specialDefenseEv: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(252)
  speedEv: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(31)
  hpIv: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(31)
  attackIv: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(31)
  defenseIv: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(31)
  specialAttackIv: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(31)
  specialDefenseIv: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(31)
  speedIv: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  natureId: number;
}
