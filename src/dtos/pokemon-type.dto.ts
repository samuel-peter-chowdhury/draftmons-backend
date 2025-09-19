import { Expose, Type } from "class-transformer";
import { BaseOutputDto } from "./base-output.dto";
import { IsString } from "class-validator";
import { BaseInputDto } from "./base-input.dto";
import { MoveOutputDto } from "./move.dto";
import { PokemonOutputDto } from "./pokemon.dto";
import { TypeEffectiveOutputDto } from "./type-effective.dto";

export class PokemonTypeOutputDto extends BaseOutputDto {
  @Expose()
  name: string;

  @Expose()
  color: string;

  @Expose({ groups: ['pokemonType.full'] })
  @Type(() => MoveOutputDto)
  moves: MoveOutputDto[];

  @Expose({ groups: ['pokemonType.full'] })
  @Type(() => PokemonOutputDto)
  pokemon: PokemonOutputDto[];

  @Expose({ groups: ['pokemonType.full'] })
  @Type(() => TypeEffectiveOutputDto)
  typeEffectiveness: TypeEffectiveOutputDto[];
}

export class PokemonTypeInputDto extends BaseInputDto {
  @IsString()
  name: string;

  @IsString()
  color: string;
}
