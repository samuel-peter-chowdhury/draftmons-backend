import { Expose, Type } from 'class-transformer';
import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsIn } from 'class-validator';

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

  @Expose()
  sprite: string;

  @Expose()
  @Type(() => PokemonTypeDto)
  pokemonTypes?: PokemonTypeDto[];

  @Expose({ groups: ['pokemon.full'] })
  @Type(() => PokemonMoveDto)
  pokemonMoves?: PokemonMoveDto[];

  @Expose()
  @Type(() => AbilityDto)
  abilities?: AbilityDto[];

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
  id: number;

  @Expose()
  name: string;

  @Expose()
  color: string;
}

// Ability DTO
export class AbilityDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  description: string;
}

// Type Effective DTO
export class TypeEffectiveDto {
  @Expose()
  pokemonId: number;

  @Expose()
  @Type(() => PokemonTypeDto)
  pokemonType?: PokemonTypeDto;

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
  @Type(() => PokemonTypeDto)
  pokemonType?: PokemonTypeDto;

  @Expose()
  category: string;

  @Expose()
  power: number;

  @Expose()
  accuracy: number;

  @Expose()
  priority: number;

  @Expose()
  pp: number;

  @Expose()
  description: string;
}

// Pokemon Move DTO
export class PokemonMoveDto {
  @Expose()
  pokemonId: number;

  @Expose()
  moveId: number;

  @Expose()
  generationId: number;

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
  @Type(() => PokemonTypeDto)
  types?: PokemonTypeDto[];
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

// Pokemon Search DTO
export class PokemonSearchDto {
  @IsOptional()
  @IsNumber()
  generationId?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  dexId?: number;

  @IsOptional()
  @IsNumber()
  pokemonTypeId?: number;

  @IsOptional()
  @IsNumber()
  pokemonMoveId?: number;

  @IsOptional()
  @IsNumber()
  abilityId?: number;

  @IsOptional()
  @IsNumber()
  seasonId?: number;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  minHp?: number;

  @IsOptional()
  @IsNumber()
  maxHp?: number;

  @IsOptional()
  @IsNumber()
  minAttack?: number;

  @IsOptional()
  @IsNumber()
  maxAttack?: number;

  @IsOptional()
  @IsNumber()
  minDefense?: number;

  @IsOptional()
  @IsNumber()
  maxDefense?: number;

  @IsOptional()
  @IsNumber()
  minSpecialAttack?: number;

  @IsOptional()
  @IsNumber()
  maxSpecialAttack?: number;

  @IsOptional()
  @IsNumber()
  minSpecialDefense?: number;

  @IsOptional()
  @IsNumber()
  maxSpecialDefense?: number;

  @IsOptional()
  @IsNumber()
  minSpeed?: number;

  @IsOptional()
  @IsNumber()
  maxSpeed?: number;

  @IsOptional()
  @IsNumber()
  minBaseStatTotal?: number;

  @IsOptional()
  @IsNumber()
  maxBaseStatTotal?: number;

  @IsOptional()
  @IsString()
  @IsIn(['dexId', 'name', 'hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed', 'baseStatTotal', 'height', 'weight'])
  sortBy?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}