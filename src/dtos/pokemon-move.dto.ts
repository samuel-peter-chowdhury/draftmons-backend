import { Expose, Type } from 'class-transformer';
import { BaseOutputDto, BaseInputDto } from './base.dto';
import { IsNumber } from 'class-validator';
import { MoveOutputDto } from './move.dto';
import { GenerationOutputDto } from './generation.dto';
import { PokemonOutputDto } from './pokemon.dto';

export class PokemonMoveOutputDto extends BaseOutputDto {
  @Expose()
  pokemonId: number;

  @Expose()
  moveId: number;

  @Expose()
  generationId: number;

  @Expose({ groups: ['pokemonMove.full'] })
  @Type(() => PokemonOutputDto)
  pokemon: PokemonOutputDto;

  @Expose({ groups: ['pokemonMove.full'] })
  @Type(() => MoveOutputDto)
  move: MoveOutputDto;

  @Expose({ groups: ['pokemonMove.full'] })
  @Type(() => GenerationOutputDto)
  generation: GenerationOutputDto;
}

export class PokemonMoveInputDto extends BaseInputDto {
  @IsNumber()
  pokemonId: number;

  @IsNumber()
  moveId: number;

  @IsNumber()
  generationId: number;
}
