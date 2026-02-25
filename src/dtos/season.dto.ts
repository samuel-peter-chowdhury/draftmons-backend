import { Expose, Type } from 'class-transformer';
import { BaseOutputDto, BaseInputDto } from './base.dto';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { LeagueOutputDto } from './league.dto';
import { SeasonPokemonOutputDto } from './season-pokemon.dto';
import { TeamOutputDto } from './team.dto';
import { WeekOutputDto } from './week.dto';
import { SeasonStatus } from '../entities/season.entity';
import { GenerationOutputDto } from './generation.dto';

export class SeasonOutputDto extends BaseOutputDto {
  @Expose()
  name: string;

  @Expose()
  status: SeasonStatus;

  @Expose()
  rules: string;

  @Expose()
  pointLimit: number;

  @Expose()
  maxPointValue: number;

  @Expose()
  leagueId: number;

  @Expose()
  generationId: number;

  @Expose({ groups: ['season.full'] })
  @Type(() => LeagueOutputDto)
  league: LeagueOutputDto;

  @Expose()
  @Type(() => GenerationOutputDto)
  generation: GenerationOutputDto;

  @Expose({ groups: ['season.full'] })
  @Type(() => TeamOutputDto)
  teams: TeamOutputDto[];

  @Expose({ groups: ['season.full'] })
  @Type(() => WeekOutputDto)
  weeks: WeekOutputDto[];

  @Expose({ groups: ['season.full'] })
  @Type(() => SeasonPokemonOutputDto)
  seasonPokemon: SeasonPokemonOutputDto[];
}

export class SeasonInputDto extends BaseInputDto {
  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsEnum(SeasonStatus)
  status: SeasonStatus;

  @Expose()
  @IsOptional()
  @IsString()
  rules: string;

  @Expose()
  @IsNumber()
  pointLimit: number;

  @Expose()
  @IsNumber()
  maxPointValue: number;

  @Expose()
  @IsNumber()
  leagueId: number;

  @Expose()
  @IsNumber()
  generationId: number;
}
