import { Expose, Type } from "class-transformer";
import { BaseOutputDto } from "./base-output.dto";
import { IsString } from "class-validator";
import { BaseInputDto } from "./base-input.dto";
import { PokemonMoveOutputDto } from "./pokemon-move.dto";
import { PokemonOutputDto } from "./pokemon.dto";

export class GenerationOutputDto extends BaseOutputDto {
  @Expose()
  name: string;

  @Expose({ groups: ['generation.full'] })
  @Type(() => PokemonMoveOutputDto)
  pokemonMoves: PokemonMoveOutputDto[];

  @Expose({ groups: ['generation.full'] })
  @Type(() => PokemonOutputDto)
  pokemon: PokemonOutputDto[];
}

export class GenerationInputDto extends BaseInputDto {
  @IsString()
  name: string;
}
