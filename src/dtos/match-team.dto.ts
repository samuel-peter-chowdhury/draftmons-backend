import { Expose, Type } from "class-transformer";
import { BaseOutputDto } from "./base-output.dto";
import { IsNumber, IsString } from "class-validator";
import { BaseInputDto } from "./base-input.dto";
import { MatchOutputDto } from "./match.dto";
import { TeamOutputDto } from "./team.dto";

export class MatchTeamOutputDto extends BaseOutputDto {
  @Expose()
  matchId: number;

  @Expose()
  teamId: number;

  @Expose()
  status: string;

  @Expose({ groups: ['matchTeam.full'] })
  @Type(() => MatchOutputDto)
  match: MatchOutputDto;

  @Expose({ groups: ['matchTeam.full'] })
  @Type(() => TeamOutputDto)
  team: TeamOutputDto;
}

export class MatchTeamInputDto extends BaseInputDto {
  @IsNumber()
  matchId: number;

  @IsNumber()
  teamId: number;

  @IsString()
  status: string;
}
