import { Expose, Type } from 'class-transformer';
import { BaseOutputDto, BaseInputDto } from './base.dto';
import { IsNumber } from 'class-validator';
import { SeasonPokemonOutputDto } from './season-pokemon.dto';
import { TeamOutputDto } from './team.dto';

export class SeasonPokemonTeamOutputDto extends BaseOutputDto {
  @Expose()
  seasonPokemonId: number;

  @Expose()
  teamId: number;

  @Expose({ groups: ['seasonPokemonTeam.full'] })
  @Type(() => SeasonPokemonOutputDto)
  seasonPokemon: SeasonPokemonOutputDto;

  @Expose({ groups: ['seasonPokemonTeam.full'] })
  @Type(() => TeamOutputDto)
  team: TeamOutputDto;
}

export class SeasonPokemonTeamInputDto extends BaseInputDto {
  @IsNumber()
  seasonPokemonId: number;

  @IsNumber()
  teamId: number;
}
