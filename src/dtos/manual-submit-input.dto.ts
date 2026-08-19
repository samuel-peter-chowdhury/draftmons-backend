import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsUrl,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BaseInputDto } from './base.dto';
import { MatchResultSource } from '../entities/match.entity';

// The two result sources a moderator can write by hand. REPLAY is reserved for
// the parsed-replay pipeline (SubmitInputDto / MatchAnalysisService.submit()).
export type ManualResultSource = MatchResultSource.MANUAL | MatchResultSource.FORFEIT;

// ---------------------------------------------------------------------------
// Nested DTOs — plain classes, mirroring submit-input.dto.ts. These are
// intentionally LOOSER than SubmitStatInputDto/SubmitGameInputDto: a manually
// recorded game may have no replay and no stats at all, so replayLink and stats
// are optional (following GameInputDto's convention, not SubmitGameInputDto's).
// ---------------------------------------------------------------------------

export class ManualStatInputDto {
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

export class ManualGameInputDto {
  @IsNumber()
  winningTeamId: number;

  @IsNumber()
  losingTeamId: number;

  // Defaults to 0 server-side when omitted (forfeit placeholders, or a manual
  // game where the moderator doesn't know the surviving-Pokémon count).
  @IsOptional()
  @IsNumber()
  @Min(0)
  differential?: number;

  @IsOptional()
  @IsUrl()
  replayLink?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManualStatInputDto)
  stats?: ManualStatInputDto[];
}

// ---------------------------------------------------------------------------
// Top-level DTO — unlike SubmitInputDto, the match winner/loser is stated
// explicitly rather than derived, because a FORFEIT can have zero games.
// `games` may be empty (FORFEIT with no score); MANUAL's non-empty +
// strict-majority rules are enforced in MatchAnalysisService.submitManual().
// ---------------------------------------------------------------------------

export class ManualSubmitInputDto extends BaseInputDto {
  @IsNumber()
  matchId: number;

  @IsIn([MatchResultSource.MANUAL, MatchResultSource.FORFEIT])
  resultSource: ManualResultSource;

  @IsBoolean()
  confirmOverwrite: boolean;

  @IsNumber()
  winningTeamId: number;

  @IsNumber()
  losingTeamId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManualGameInputDto)
  games: ManualGameInputDto[];
}
