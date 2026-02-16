import { Expose, Type } from 'class-transformer';
import { BaseOutputDto, BaseInputDto } from './base.dto';
import { IsString } from 'class-validator';
import { PokemonOutputDto } from './pokemon.dto';
import { MoveOutputDto } from './move.dto';
import { AbilityOutputDto } from './ability.dto';

export class GenerationOutputDto extends BaseOutputDto {
  @Expose()
  name: string;

  @Expose({ groups: ['generation.full'] })
  @Type(() => PokemonOutputDto)
  pokemon: PokemonOutputDto[];

  @Expose({ groups: ['generation.full'] })
  @Type(() => MoveOutputDto)
  moves: MoveOutputDto[];

  @Expose({ groups: ['generation.full'] })
  @Type(() => AbilityOutputDto)
  abilities: AbilityOutputDto[];
}

export class GenerationInputDto extends BaseInputDto {
  @IsString()
  name: string;
}
