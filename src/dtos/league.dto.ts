import { Expose, Type } from 'class-transformer';
import { BaseOutputDto, BaseInputDto } from './base.dto';
import { IsString, IsOptional } from 'class-validator';
import { LeagueUserOutputDto } from './league-user.dto';
import { SeasonOutputDto } from './season.dto';

export class LeagueOutputDto extends BaseOutputDto {
  @Expose()
  name: string;

  @Expose()
  abbreviation: string;

  @Expose()
  discordGuildId: string | null;

  @Expose()
  discordChannelId: string | null;

  @Expose({ groups: ['league.full'] })
  @Type(() => LeagueUserOutputDto)
  leagueUsers: LeagueUserOutputDto[];

  @Expose({ groups: ['league.full'] })
  @Type(() => SeasonOutputDto)
  seasons: SeasonOutputDto[];
}

export class LeagueInputDto extends BaseInputDto {
  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsString()
  abbreviation: string;

  @Expose()
  @IsOptional()
  @IsString()
  discordGuildId?: string | null;

  @Expose()
  @IsOptional()
  @IsString()
  discordChannelId?: string | null;
}
