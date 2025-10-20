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
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  @Expose()
  email: string;

  @Expose()
  isAdmin: boolean;

  @Expose()
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
  @IsOptional()
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  email: string;

  @IsBoolean()
  isAdmin: boolean;

  @IsOptional()
  @IsString()
  googleId: string;

  @IsOptional()
  @IsString()
  showdownUsername: string;

  @IsOptional()
  @IsString()
  discordUsername: string;

  @IsOptional()
  @IsString()
  timezone: string;
}
