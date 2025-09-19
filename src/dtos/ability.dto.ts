import { Expose, Type } from "class-transformer";
import { BaseOutputDto } from "./base-output.dto";
import { IsString } from "class-validator";
import { BaseInputDto } from "./base-input.dto";
import { PokemonOutputDto } from "./pokemon.dto";

export class AbilityOutputDto extends BaseOutputDto {
  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose({ groups: ['ability.full'] })
  @Type(() => PokemonOutputDto)
  pokemon: PokemonOutputDto[];
}

export class AbilityInputDto extends BaseInputDto {
  @IsString()
  name: string;

  @IsString()
  description: string;
}
