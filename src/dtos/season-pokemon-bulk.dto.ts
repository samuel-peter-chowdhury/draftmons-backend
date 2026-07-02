import { ArrayMaxSize, IsArray, IsInt, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { BaseInputDto } from './base.dto';

// ---------------------------------------------------------------------------
// Error codes — string-valued, kept separate from PreviewErrorCode (D-09).
// Exactly two codes per D-08: unresolved Pokémon name (covers wrong-generation
// too, per D-02) and invalid point value (out of range / blank / non-integer).
// ---------------------------------------------------------------------------

export enum BulkUpsertErrorCode {
  POKEMON_NOT_FOUND = 'POKEMON_NOT_FOUND',
  INVALID_POINT_VALUE = 'INVALID_POINT_VALUE',
}

export enum BulkUpsertEntryStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
}

// ---------------------------------------------------------------------------
// Input DTOs — nested-array pattern per submit-input.dto.ts
// ---------------------------------------------------------------------------

export class BulkUpsertEntryInputDto {
  @IsString()
  name: string;

  // MUST be @IsOptional() — a missing/blank pointValue must surface as a
  // per-entry INVALID_POINT_VALUE failure (D-06), not a whole-request 400
  // from validateDto()'s non-skipMissingProperties class-validator call
  // (Pitfall 1). class-validator's @IsOptional() only special-cases strict
  // null/undefined, NOT an empty string — so a blank ('') or null pointValue
  // (the most likely "blank CSV cell" shape) is normalized to undefined by
  // @Transform BEFORE validate() runs, which makes @IsOptional() actually
  // short-circuit @IsInt() for those values (CR-01, 06-REVIEW.md /
  // 06-VERIFICATION.md). The "must be present, integer, 0..maxPointValue"
  // rule is enforced per-entry in the service, where the live
  // season.maxPointValue is available.
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsOptional()
  @IsInt()
  pointValue?: number;
}

export class BulkUpsertInputDto extends BaseInputDto {
  @IsNumber()
  seasonId: number;

  @IsArray()
  // Request-shape DoS backstop (threat T-06-04), defense-in-depth over the
  // existing express.json({ limit: '1mb' }) body cap — generous enough to
  // admit a full-generation dex.
  @ArrayMaxSize(2000)
  @ValidateNested({ each: true })
  @Type(() => BulkUpsertEntryInputDto)
  entries: BulkUpsertEntryInputDto[];
}

// ---------------------------------------------------------------------------
// Result DTO — per-entry response element (D-10), parallel to the request
// array. Distinct from PreviewErrorDto because it must also carry
// name/pointValue/status for successes, not just failures.
// ---------------------------------------------------------------------------

export class BulkUpsertEntryResultDto {
  @Expose() name: string;
  @Expose() pointValue: number | undefined;
  @Expose() status: BulkUpsertEntryStatus;
  @Expose() code?: BulkUpsertErrorCode;
  @Expose() message?: string;
}
