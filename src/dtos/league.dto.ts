import { Expose, Type } from 'class-transformer';
import { BaseOutputDto, BaseInputDto } from './base.dto';
import { IsString } from 'class-validator';
import { LeagueUserOutputDto } from './league-user.dto';
import { SeasonOutputDto } from './season.dto';

export class LeagueOutputDto extends BaseOutputDto {
  @Expose()
  name: string;

  @Expose()
  abbreviation: string;

  @Expose({ groups: ['league.full'] })
  @Type(() => LeagueUserOutputDto)
  leagueUsers: LeagueUserOutputDto[];

  @Expose({ groups: ['league.full'] })
  @Type(() => SeasonOutputDto)
  seasons: SeasonOutputDto[];
}

export class LeagueInputDto extends BaseInputDto {
  @IsString()
  name: string;

  @IsString()
  abbreviation: string;
}
