import { Expose, Type } from "class-transformer";
import { BaseOutputDto } from "./base-output.dto";
import { IsNumber, IsString } from "class-validator";
import { BaseInputDto } from "./base-input.dto";
import { PokemonMoveOutputDto } from "./pokemon-move.dto";
import { AbilityOutputDto } from "./ability.dto";
import { GenerationOutputDto } from "./generation.dto";
import { PokemonTypeOutputDto } from "./pokemon-type.dto";
import { TypeEffectiveOutputDto } from "./type-effective.dto";
import { SeasonPokemonOutputDto } from "./season-pokemon.dto";

export class PokemonOutputDto extends BaseOutputDto {
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

  @Expose({ groups: ['pokemon.full'] })
  @Type(() => PokemonTypeOutputDto)
  pokemonTypes: PokemonTypeOutputDto[];

  @Expose({ groups: ['pokemon.full'] })
  @Type(() => PokemonMoveOutputDto)
  pokemonMoves: PokemonMoveOutputDto[];

  @Expose({ groups: ['pokemon.full'] })
  @Type(() => AbilityOutputDto)
  abilities: AbilityOutputDto[];

  @Expose({ groups: ['pokemon.full'] })
  @Type(() => TypeEffectiveOutputDto)
  typeEffectiveness: TypeEffectiveOutputDto[];

  @Expose({ groups: ['pokemon.full'] })
  @Type(() => SeasonPokemonOutputDto)
  seasonPokemon: SeasonPokemonOutputDto[];

  @Expose({ groups: ['pokemon.full'] })
  @Type(() => GenerationOutputDto)
  generations: GenerationOutputDto[];
}

export class PokemonInputDto extends BaseInputDto {
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

  @IsString()
  sprite: string;
}
