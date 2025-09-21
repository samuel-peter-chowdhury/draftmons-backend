import { Expose, Type } from "class-transformer";
import { BaseOutputDto } from "./base-output.dto";
import { IsNumber, IsOptional, IsString } from "class-validator";
import { GameStatOutputDto } from "./game-stat.dto";
import { BaseInputDto } from "./base-input.dto";
import { MatchOutputDto } from "./match.dto";
import { TeamOutputDto } from "./team.dto";

export class GameOutputDto extends BaseOutputDto {
  @Expose()
  matchId: number;

  @Expose()
  losingTeamId: number;

  @Expose()
  winningTeamId: number;

  @Expose()
  differential: number;

  @Expose()
  replayLink: string;

  @Expose({ groups: ['game.full'] })
  @Type(() => MatchOutputDto)
  match: MatchOutputDto;

  @Expose({ groups: ['game.full'] })
  @Type(() => TeamOutputDto)
  losingTeam: TeamOutputDto;

  @Expose({ groups: ['game.full'] })
  @Type(() => TeamOutputDto)
  winningTeam: TeamOutputDto;

  @Expose({ groups: ['game.full'] })
  @Type(() => GameStatOutputDto)
  gameStats: GameStatOutputDto[];
}

export class GameInputDto extends BaseInputDto {
  @IsNumber()
  matchId: number;

  @IsNumber()
  losingTeamId: number;

  @IsNumber()
  winningTeamId: number;

  @IsNumber()
  differential: number;

  @IsOptional()
  @IsString()
  replayLink: string;
}
