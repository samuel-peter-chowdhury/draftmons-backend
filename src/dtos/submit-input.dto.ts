import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsUrl,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BaseInputDto } from './base.dto';

// ---------------------------------------------------------------------------
// Nested DTOs — plain classes (not extending BaseInputDto), mirroring the
// plain nested DTO pattern in match-analysis.dto.ts (StatPreviewDto, etc.)
// ---------------------------------------------------------------------------

export class SubmitStatInputDto {
  @IsNumber()
  seasonPokemonId: number;

  @IsNumber()
  @Min(0)
  directKills: number;

  @IsNumber()
  @Min(0)
  indirectKills: number;

  @IsNumber()
  @Min(0)
  deaths: number;
}

export class SubmitGameInputDto {
  @IsInt()
  @Min(1)
  gameNumber: number;

  @IsUrl()
  replayLink: string;

  @IsNumber()
  winningTeamId: number;

  @IsNumber()
  losingTeamId: number;

  @IsNumber()
  @Min(0)
  differential: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubmitStatInputDto)
  stats: SubmitStatInputDto[];
}

// ---------------------------------------------------------------------------
// Top-level DTO — extends BaseInputDto (slim resolved-IDs submit contract D-01)
// ---------------------------------------------------------------------------

export class SubmitInputDto extends BaseInputDto {
  @IsNumber()
  seasonId: number;

  @IsNumber()
  matchId: number;

  @IsBoolean()
  confirmOverwrite: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubmitGameInputDto)
  games: SubmitGameInputDto[];
}
