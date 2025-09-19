import { Expose, Type } from "class-transformer";
import { BaseOutputDto } from "./base-output.dto";
import { IsNumber, IsString } from "class-validator";
import { BaseInputDto } from "./base-input.dto";
import { PokemonTypeOutputDto } from "./pokemon-type.dto";
import { PokemonMoveOutputDto } from "./pokemon-move.dto";

export class MoveOutputDto extends BaseOutputDto {
  @Expose()
  name: string;

  @Expose()
  pokemonTypeId: number;

  @Expose({ groups: ['move.full'] })
  @Type(() => PokemonTypeOutputDto)
  pokemonType: PokemonTypeOutputDto;

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

  @Expose({ groups: ['move.full'] })
  @Type(() => PokemonMoveOutputDto)
  pokemonMoves: PokemonMoveOutputDto[];
}

export class MoveInputDto extends BaseInputDto {
  @IsString()
  name: string;

  @IsNumber()
  pokemonTypeId: number;

  @IsString()
  category: string;

  @IsNumber()
  power: number;

  @IsNumber()
  accuracy: number;

  @IsNumber()
  priority: number;

  @IsNumber()
  pp: number;

  @IsString()
  description: string;
}
