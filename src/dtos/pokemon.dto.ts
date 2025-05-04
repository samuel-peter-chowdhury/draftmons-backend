import { Expose, Type } from 'class-transformer';
import { IsString, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';

export class PokemonDto {
  @Expose()
  id: number;

  @Expose()
  dexId: number;

  @Expose()
  name: string;

  @Expose()
  hp: number;

  @Expose()
  attack: number;

  @Expose()
  defense: number;

  @Expose()
  specialAttack: number;

  @Expose()
  specialDefense: number;

  @Expose()
  speed: number;

  @Expose()
  baseStatTotal: number;

  @Expose()
  height: number;

  @Expose()
  weight: number;

  @Expose({ groups: ['pokemon.full'] })
  @Type(() => PokemonTypeDto)
  types?: PokemonTypeDto[];

  @Expose({ groups: ['pokemon.full'] })
  @Type(() => PokemonAbilityDto)
  abilities?: PokemonAbilityDto[];

  @Expose({ groups: ['pokemon.full'] })
  @Type(() => TypeEffectiveDto)
  typeEffectiveness?: TypeEffectiveDto[];

  @Expose({ groups: ['pokemon.full'] })
  createdAt: Date;

  @Expose({ groups: ['pokemon.full'] })
  updatedAt: Date;
}

// Pokemon Type DTO
export class PokemonTypeDto {
  @Expose()
  pokemonId: number;

  @Expose()
  type: string;
}

// Ability DTO
export class AbilityDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  description: string | null;
}

// Pokemon Ability DTO
export class PokemonAbilityDto {
  @Expose()
  pokemonId: number;

  @Expose()
  abilityId: number;

  @Expose({ groups: ['pokemonAbility.full'] })
  @Type(() => AbilityDto)
  ability?: AbilityDto;
}

// Type Effective DTO
export class TypeEffectiveDto {
  @Expose()
  pokemonId: number;

  @Expose()
  type: string;

  @Expose()
  value: number;
}

// Move DTO
export class MoveDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  type: string;

  @Expose()
  category: string;

  @Expose()
  power: number | null;

  @Expose()
  accuracy: number | null;

  @Expose()
  priority: number;

  @Expose()
  pp: number | null;

  @Expose()
  description: string | null;
}

// Pokemon Move DTO
export class PokemonMoveDto {
  @Expose()
  pokemonId: number;

  @Expose()
  moveId: number;

  @Expose()
  gen: string;

  @Expose({ groups: ['pokemonMove.full'] })
  @Type(() => MoveDto)
  move?: MoveDto;
}

// Create Pokemon DTO
export class CreatePokemonDto {
  @IsNumber()
  dexId: number;

  @IsString()
  name: string;

  @IsNumber()
  hp: number;

  @IsNumber()
  attack: number;

  @IsNumber()
  defense: number;

  @IsNumber()
  specialAttack: number;

  @IsNumber()
  specialDefense: number;

  @IsNumber()
  speed: number;

  @IsNumber()
  baseStatTotal: number;

  @IsNumber()
  height: number;

  @IsNumber()
  weight: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePokemonTypeDto)
  types?: CreatePokemonTypeDto[];
}

// Create Pokemon Type DTO
export class CreatePokemonTypeDto {
  @IsString()
  type: string;
}

// Update Pokemon DTO
export class UpdatePokemonDto {
  @IsOptional()
  @IsNumber()
  dexId?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  hp?: number;

  @IsOptional()
  @IsNumber()
  attack?: number;

  @IsOptional()
  @IsNumber()
  defense?: number;

  @IsOptional()
  @IsNumber()
  specialAttack?: number;

  @IsOptional()
  @IsNumber()
  specialDefense?: number;

  @IsOptional()
  @IsNumber()
  speed?: number;

  @IsOptional()
  @IsNumber()
  baseStatTotal?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  weight?: number;
}
