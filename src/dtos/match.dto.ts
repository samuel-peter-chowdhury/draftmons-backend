import { Expose, Type } from "class-transformer";
import { BaseOutputDto } from "./base-output.dto";
import { IsNumber, IsOptional } from "class-validator";
import { BaseInputDto } from "./base-input.dto";
import { GameOutputDto } from "./game.dto";
import { WeekOutputDto } from "./week.dto";
import { TeamOutputDto } from "./team.dto";

export class MatchOutputDto extends BaseOutputDto {
  @Expose()
  weekId: number;

  @Expose()
  losingTeamId: number;

  @Expose()
  winningTeamId: number;

  @Expose({ groups: ['match.full'] })
  @Type(() => WeekOutputDto)
  week: WeekOutputDto;

  @Expose({ groups: ['match.full'] })
  @Type(() => TeamOutputDto)
  teams: TeamOutputDto[];

  @Expose({ groups: ['match.full'] })
  @Type(() => TeamOutputDto)
  losingTeam: TeamOutputDto;

  @Expose({ groups: ['match.full'] })
  @Type(() => TeamOutputDto)
  winningTeam: TeamOutputDto;

  @Expose({ groups: ['match.full'] })
  @Type(() => GameOutputDto)
  games: GameOutputDto[];
}

export class MatchInputDto extends BaseInputDto {
  @IsNumber()
  weekId: number;

  @IsOptional()
  @IsNumber()
  losingTeamId: number;

  @IsOptional()
  @IsNumber()
  winningTeamId: number;
}
