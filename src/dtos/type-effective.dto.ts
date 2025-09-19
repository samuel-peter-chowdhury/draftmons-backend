import { Expose, Type } from "class-transformer";
import { BaseOutputDto } from "./base-output.dto";
import { IsNumber } from "class-validator";
import { BaseInputDto } from "./base-input.dto";
import { PokemonTypeOutputDto } from "./pokemon-type.dto";
import { PokemonOutputDto } from "./pokemon.dto";

export class TypeEffectiveOutputDto extends BaseOutputDto {
  @Expose()
  pokemonId: number;

  @Expose()
  pokemonTypeId: number;

  @Expose({ groups: ['typeEffective.full'] })
  @Type(() => PokemonTypeOutputDto)
  pokemonType: PokemonTypeOutputDto;

  @Expose()
  value: number;

  @Expose({ groups: ['typeEffective.full'] })
  @Type(() => PokemonOutputDto)
  pokemon: PokemonOutputDto;
}

export class TypeEffectiveInputDto extends BaseInputDto {
  @IsNumber()
  pokemonId: number;

  @IsNumber()
  pokemonTypeId: number;

  @IsNumber()
  value: number;
}
