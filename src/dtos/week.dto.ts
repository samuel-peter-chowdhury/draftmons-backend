import { Expose, Type } from 'class-transformer';
import { BaseOutputDto, BaseInputDto } from './base.dto';
import { IsNumber, IsString } from 'class-validator';
import { SeasonOutputDto } from './season.dto';
import { MatchOutputDto } from './match.dto';

export class WeekOutputDto extends BaseOutputDto {
  @Expose()
  name: string;

  @Expose()
  seasonId: number;

  @Expose({ groups: ['week.full'] })
  @Type(() => SeasonOutputDto)
  season: SeasonOutputDto;

  @Expose({ groups: ['week.full'] })
  @Type(() => MatchOutputDto)
  matches: MatchOutputDto[];
}

export class WeekInputDto extends BaseInputDto {
  @IsString()
  name: string;

  @IsNumber()
  seasonId: number;
}
