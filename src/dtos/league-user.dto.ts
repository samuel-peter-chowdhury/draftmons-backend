import { Expose, Type } from "class-transformer";
import { BaseOutputDto, BaseInputDto } from "./base.dto";
import { IsBoolean, IsNumber } from "class-validator";
import { UserOutputDto } from "./user.dto";
import { LeagueOutputDto } from "./league.dto";

export class LeagueUserOutputDto extends BaseOutputDto {
  @Expose()
  leagueId: number;

  @Expose()
  userId: number;

  @Expose()
  isModerator: boolean;

  @Expose({ groups: ['leagueUser.full'] })
  @Type(() => LeagueOutputDto)
  league: LeagueOutputDto;

  @Expose({ groups: ['leagueUser.full'] })
  @Type(() => UserOutputDto)
  user: UserOutputDto;
}

export class LeagueUserInputDto extends BaseInputDto {
  @IsNumber()
  leagueId: number;

  @IsNumber()
  userId: number;

  @IsBoolean()
  isModerator: boolean;
}
