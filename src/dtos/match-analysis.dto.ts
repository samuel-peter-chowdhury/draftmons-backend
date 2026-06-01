import { Expose } from 'class-transformer';
import { IsArray, IsNumber, IsUrl } from 'class-validator';
import { BaseInputDto } from './base.dto';

// ---------------------------------------------------------------------------
// Input DTO (controller in Phase 4 will validateDto this)
// ---------------------------------------------------------------------------

export class AnalyzeInputDto extends BaseInputDto {
  @IsNumber()
  seasonId: number;

  @IsArray()
  @IsUrl({}, { each: true })
  replayUrls: string[];
}

// ---------------------------------------------------------------------------
// Error codes — string-valued so serialized JSON carries readable codes
// ---------------------------------------------------------------------------

export enum PreviewErrorCode {
  // Stage 1: fetch/parse errors (per-replay)
  REPLAY_NOT_FOUND = 'REPLAY_NOT_FOUND',
  REPLAY_PRIVATE = 'REPLAY_PRIVATE',
  REPLAY_TIMEOUT = 'REPLAY_TIMEOUT',
  REPLAY_UPSTREAM = 'REPLAY_UPSTREAM',
  REPLAY_PARSE = 'REPLAY_PARSE',
  REPLAY_DUPLICATE = 'REPLAY_DUPLICATE',

  // Stage 2: set-level validation errors
  COUNT_OUT_OF_RANGE = 'COUNT_OUT_OF_RANGE',
  PLAYERS_INCONSISTENT = 'PLAYERS_INCONSISTENT',

  // Stage 3: user resolution errors
  USER_NOT_FOUND = 'USER_NOT_FOUND',

  // Stage 4: match lookup errors
  MATCH_NOT_FOUND = 'MATCH_NOT_FOUND',
  MATCH_AMBIGUOUS = 'MATCH_AMBIGUOUS',
  MATCH_BLOCKED = 'MATCH_BLOCKED',

  // Stage 5 (03-02): Pokémon resolution + stat/winner computation
  POKEMON_NOT_FOUND = 'POKEMON_NOT_FOUND',
  POKEMON_AMBIGUOUS = 'POKEMON_AMBIGUOUS',
  GAME_INDECISIVE = 'GAME_INDECISIVE',
  SET_NOT_DECISIVE = 'SET_NOT_DECISIVE',
}

// ---------------------------------------------------------------------------
// Error DTO — field-level, accumulated (not thrown)
// ---------------------------------------------------------------------------

export class PreviewErrorDto {
  @Expose() field: string; // e.g. 'set', 'players[0].user', 'match', 'replays[1]'
  @Expose() code: string; // PreviewErrorCode value
  @Expose() message: string;
  @Expose() candidates?: unknown[]; // shape varies by code (user/pokemon/match lists)
}

// ---------------------------------------------------------------------------
// Player preview
// ---------------------------------------------------------------------------

export class PlayerPreviewDto {
  @Expose() rawShowdownName: string;
  @Expose() userId: number | null;
  @Expose() userDisplayName: string | null;
  @Expose() teamId: number | null;
  @Expose() teamName: string | null;
}

// ---------------------------------------------------------------------------
// Per-Pokémon stat preview (populated in 03-02)
// ---------------------------------------------------------------------------

export class StatPreviewDto {
  @Expose() rawName: string;
  @Expose() seasonPokemonId: number | null;
  @Expose() name: string | null;
  @Expose() teamId: number | null;
  @Expose() directKills: number;
  @Expose() indirectKills: number;
  @Expose() deaths: number;
}

// ---------------------------------------------------------------------------
// Per-game preview (populated in 03-02)
// ---------------------------------------------------------------------------

export class GamePreviewDto {
  @Expose() gameNumber: number;
  @Expose() replayUrl: string;
  @Expose() winnerTeamId: number | null;
  @Expose() loserTeamId: number | null;
  @Expose() differential: number | null;
  @Expose() stats: StatPreviewDto[];
}

// ---------------------------------------------------------------------------
// Top-level match preview — the cross-phase contract (Phases 4 and 5 consume this)
// ---------------------------------------------------------------------------

export class MatchPreviewDto {
  @Expose() seasonId: number;
  @Expose() replayUrls: string[];
  @Expose() matchId: number | null;
  @Expose() weekId: number | null;
  @Expose() weekName: string | null;
  @Expose() players: PlayerPreviewDto[]; // always length 2
  @Expose() games: GamePreviewDto[]; // populated in 03-02
  @Expose() matchWinnerTeamId: number | null;
  @Expose() matchLoserTeamId: number | null;
  @Expose() isDecisive: boolean;
  @Expose() errors: PreviewErrorDto[];
}
