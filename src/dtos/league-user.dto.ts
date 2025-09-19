import { Expose, Type } from "class-transformer";
import { BaseOutputDto } from "./base-output.dto";
import { IsString } from "class-validator";
import { BaseInputDto } from "./base-input.dto";
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
  @IsString()
  leagueId: number;

  @IsString()
  userId: number;

  @IsString()
  isModerator: boolean;
}
