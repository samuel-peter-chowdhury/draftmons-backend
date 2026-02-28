import { Expose, Type } from 'class-transformer';
import { BaseOutputDto, BaseInputDto } from './base.dto';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { UserOutputDto } from './user.dto';
import { SeasonOutputDto } from './season.dto';
import { GenerationOutputDto } from './generation.dto';
import { TeamBuildSetOutputDto } from './team-build-set.dto';

export class TeamBuildOutputDto extends BaseOutputDto {
  @Expose()
  name: string;

  @Expose()
  userId: number;

  @Expose()
  seasonId: number;

  @Expose()
  generationId: number;

  @Expose({ groups: ['teamBuild.full'] })
  @Type(() => UserOutputDto)
  user: UserOutputDto;

  @Expose({ groups: ['teamBuild.full'] })
  @Type(() => SeasonOutputDto)
  season: SeasonOutputDto;

  @Expose({ groups: ['teamBuild.full'] })
  @Type(() => GenerationOutputDto)
  generation: GenerationOutputDto;

  @Expose({ groups: ['teamBuild.full'] })
  @Type(() => TeamBuildSetOutputDto)
  teamBuildSets: TeamBuildSetOutputDto[];
}

export class TeamBuildInputDto extends BaseInputDto {
  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsNumber()
  userId: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  seasonId: number;

  @Expose()
  @IsNumber()
  generationId: number;
}
