import { Expose, Type } from 'class-transformer';
import { BaseOutputDto, BaseInputDto } from './base.dto';
import { IsEnum, IsNumber, IsString } from 'class-validator';
import { PokemonTypeOutputDto } from './pokemon-type.dto';
import { PokemonMoveOutputDto } from './pokemon-move.dto';
import { MoveCategory } from '../entities/move.entity';
import { SpecialMoveCategoryOutputDto } from './special-move-category.dto';

export class MoveOutputDto extends BaseOutputDto {
  @Expose()
  name: string;

  @Expose()
  pokemonTypeId: number;

  @Expose()
  @Type(() => PokemonTypeOutputDto)
  pokemonType: PokemonTypeOutputDto;

  @Expose()
  category: MoveCategory;

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

  @Expose({ groups: ['move.full'] })
  @Type(() => SpecialMoveCategoryOutputDto)
  specialMoveCategories: SpecialMoveCategoryOutputDto[];
}

export class MoveInputDto extends BaseInputDto {
  @IsString()
  name: string;

  @IsNumber()
  pokemonTypeId: number;

  @IsEnum(MoveCategory)
  category: MoveCategory;

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
