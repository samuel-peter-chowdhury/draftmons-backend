import { Expose, Type } from "class-transformer";
import { IsString, IsOptional, IsNumber, IsBoolean } from "class-validator";
import { UserDto } from "./user.dto";

export class LeagueDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  abbreviation: string;

  @Expose({ groups: ["league.full"] })
  createdAt: Date;

  @Expose({ groups: ["league.full"] })
  updatedAt: Date;

  @Expose({ groups: ["league.full"] })
  @Type(() => SeasonSummaryDto)
  seasons?: SeasonSummaryDto[];

  @Expose({ groups: ["league.full"] })
  @Type(() => LeagueUserDto)
  leagueUsers?: LeagueUserDto[];
}

export class CreateLeagueDto {
  @IsString()
  name: string;

  @IsString()
  abbreviation: string;

  @IsOptional()
  @IsString()
  password?: string;
}

export class UpdateLeagueDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  abbreviation?: string;

  @IsOptional()
  @IsString()
  password?: string;
}

export class LeagueUserDto {
  @Expose()
  leagueId: number;

  @Expose()
  userId: number;

  @Expose()
  isModerator: boolean;

  @Expose({ groups: ["leagueUser.full"] })
  @Type(() => UserDto)
  user?: UserDto;

  @Expose({ groups: ["leagueUser.full"] })
  @Type(() => LeagueDto)
  league?: LeagueDto;
}

export class CreateLeagueUserDto {
  @IsNumber()
  leagueId: number;

  @IsNumber()
  userId: number;

  @IsOptional()
  @IsBoolean()
  isModerator?: boolean;
}

export class UpdateLeagueUserDto {
  @IsOptional()
  @IsBoolean()
  isModerator?: boolean;
}

export class SeasonDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  gen: string;

  @Expose()
  status: string;

  @Expose()
  rules: string | null;

  @Expose()
  pointLimit: number | null;

  @Expose()
  maxPointValue: number | null;

  @Expose()
  leagueId: number;

  @Expose({ groups: ["season.full"] })
  @Type(() => LeagueDto)
  league?: LeagueDto;

  @Expose({ groups: ["season.full"] })
  @Type(() => TeamSummaryDto)
  teams?: TeamSummaryDto[];

  @Expose({ groups: ["season.full"] })
  @Type(() => WeekSummaryDto)
  weeks?: WeekSummaryDto[];

  @Expose({ groups: ["season.full"] })
  createdAt: Date;

  @Expose({ groups: ["season.full"] })
  updatedAt: Date;
}

export class SeasonSummaryDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  gen: string;

  @Expose()
  status: string;
}

export class CreateSeasonDto {
  @IsString()
  name: string;

  @IsString()
  gen: string;

  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  rules?: string;

  @IsOptional()
  @IsNumber()
  pointLimit?: number;

  @IsOptional()
  @IsNumber()
  maxPointValue?: number;

  @IsNumber()
  leagueId: number;
}

export class UpdateSeasonDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  gen?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  rules?: string;

  @IsOptional()
  @IsNumber()
  pointLimit?: number;

  @IsOptional()
  @IsNumber()
  maxPointValue?: number;
}

export class TeamSummaryDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  userId: number;
}

export class WeekSummaryDto {
  @Expose()
  id: number;

  @Expose()
  name: string;
}
