import { Expose, Type } from 'class-transformer';
import { BaseOutputDto, BaseInputDto } from './base.dto';
import { IsString } from 'class-validator';
import { MoveOutputDto } from './move.dto';
import { PokemonOutputDto } from './pokemon.dto';
import { TypeEffectiveOutputDto } from './type-effective.dto';

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
