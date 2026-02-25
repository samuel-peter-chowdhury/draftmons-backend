import { Expose, Type } from 'class-transformer';
import { BaseOutputDto, BaseInputDto } from './base.dto';
import { IsNumber, IsString } from 'class-validator';
import { PokemonOutputDto } from './pokemon.dto';
import { GenerationOutputDto } from './generation.dto';

export class AbilityOutputDto extends BaseOutputDto {
  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  generationId: number;

  @Expose()
  @Type(() => GenerationOutputDto)
  generation: GenerationOutputDto;

  @Expose({ groups: ['ability.full'] })
  @Type(() => PokemonOutputDto)
  pokemon: PokemonOutputDto[];
}

export class AbilityInputDto extends BaseInputDto {
  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsString()
  description: string;

  @Expose()
  @IsNumber()
  generationId: number;
}
