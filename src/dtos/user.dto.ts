import { Expose, Type } from 'class-transformer';
import { BaseOutputDto, BaseInputDto } from './base.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { LeagueUserOutputDto } from './league-user.dto';
import { TeamOutputDto } from './team.dto';

export class UserOutputDto extends BaseOutputDto {
  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  email: string;

  @Expose()
  isAdmin: boolean;

  @Expose({ groups: ['user.private'] })
  googleId: string;

  @Expose()
  showdownUsername: string;

  @Expose()
  discordUsername: string;

  @Expose()
  timezone: string;

  @Expose({ groups: ['user.full'] })
  @Type(() => LeagueUserOutputDto)
  leagueUsers: LeagueUserOutputDto[];

  @Expose({ groups: ['user.full'] })
  @Type(() => TeamOutputDto)
  teams: TeamOutputDto[];
}

export class UserInputDto extends BaseInputDto {
  @Expose()
  @IsOptional()
  @IsString()
  firstName: string;

  @Expose()
  @IsOptional()
  @IsString()
  lastName: string;

  @Expose()
  @IsOptional()
  @IsString()
  email: string;

  @Expose()
  @IsOptional()
  @IsString()
  googleId: string;

  @Expose()
  @IsOptional()
  @IsString()
  showdownUsername: string;

  @Expose()
  @IsOptional()
  @IsString()
  discordUsername: string;

  @Expose()
  @IsOptional()
  @IsString()
  timezone: string;
}

export class AdminUserRoleDto {
  @IsBoolean()
  isAdmin: boolean;
}
