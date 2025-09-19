import { Exclude, Expose, Type } from "class-transformer";
import { BaseOutputDto } from "./base-output.dto";
import { IsOptional, IsString } from "class-validator";
import { BaseInputDto } from "./base-input.dto";
import { LeagueUserOutputDto } from "./league-user.dto";
import { SeasonOutputDto } from "./season.dto";

export class LeagueOutputDto extends BaseOutputDto {
  @Expose()
  name: string;

  @Expose()
  abbreviation: string;

  @Exclude()
  password: string;

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

  @IsOptional()
  @IsString()
  password: string;
}
