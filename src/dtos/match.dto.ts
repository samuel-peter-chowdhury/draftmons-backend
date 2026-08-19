import { Expose, Type } from 'class-transformer';
import { BaseOutputDto, BaseInputDto } from './base.dto';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNumber, IsOptional } from 'class-validator';
import { GameOutputDto } from './game.dto';
import { WeekOutputDto } from './week.dto';
import { TeamOutputDto } from './team.dto';
import { MatchResultSource } from '../entities/match.entity';

export class MatchOutputDto extends BaseOutputDto {
  @Expose()
  weekId: number;

  @Expose()
  losingTeamId: number;

  @Expose()
  winningTeamId: number;

  // NULL means "no result yet". Only ever written by the match-upload submit /
  // submit-manual flows — deliberately absent from MatchInputDto so the generic
  // PUT /api/league/:leagueId/match/:id cannot set it.
  @Expose()
  resultSource: MatchResultSource | null;

  @Expose({ groups: ['match.full', 'team.full'] })
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
  @Expose()
  @IsNumber()
  weekId: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  losingTeamId: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  winningTeamId: number;

  @Expose()
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsInt({ each: true })
  teamIds?: number[];
}
