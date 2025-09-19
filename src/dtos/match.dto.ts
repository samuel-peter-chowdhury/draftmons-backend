import { Expose, Type } from "class-transformer";
import { BaseOutputDto } from "./base-output.dto";
import { IsNumber } from "class-validator";
import { BaseInputDto } from "./base-input.dto";
import { MatchTeamOutputDto } from "./match-team.dto";
import { GameOutputDto } from "./game.dto";
import { WeekOutputDto } from "./week.dto";

export class MatchOutputDto extends BaseOutputDto {
  @Expose()
  weekId: number;

  @Expose({ groups: ['match.full'] })
  @Type(() => WeekOutputDto)
  week: WeekOutputDto;

  @Expose({ groups: ['match.full'] })
  @Type(() => MatchTeamOutputDto)
  matchTeams: MatchTeamOutputDto[];

  @Expose({ groups: ['match.full'] })
  @Type(() => GameOutputDto)
  games: GameOutputDto[];
}

export class MatchInputDto extends BaseInputDto {
  @IsNumber()
  weekId: number;
}
