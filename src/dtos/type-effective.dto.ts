import { Expose, Type } from 'class-transformer';
import { BaseOutputDto, BaseInputDto } from './base.dto';
import { IsNumber } from 'class-validator';
import { PokemonTypeOutputDto } from './pokemon-type.dto';
import { PokemonOutputDto } from './pokemon.dto';

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
