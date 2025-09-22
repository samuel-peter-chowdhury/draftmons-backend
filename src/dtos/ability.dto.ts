import { Expose, Type } from "class-transformer";
import { BaseOutputDto, BaseInputDto } from "./base.dto";
import { IsString } from "class-validator";
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
