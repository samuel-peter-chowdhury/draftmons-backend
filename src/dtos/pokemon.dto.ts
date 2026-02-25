import { Expose, Type, Transform } from 'class-transformer';
import { BaseOutputDto, BaseInputDto } from './base.dto';
import { IsNumber, IsString } from 'class-validator';
import { MoveOutputDto } from './move.dto';
import { AbilityOutputDto } from './ability.dto';
import { GenerationOutputDto } from './generation.dto';
import { PokemonTypeOutputDto } from './pokemon-type.dto';
import { TypeEffectiveOutputDto } from './type-effective.dto';
import { SeasonPokemonOutputDto } from './season-pokemon.dto';

export class PokemonOutputDto extends BaseOutputDto {
  @Expose()
  dexId: number;

  @Expose()
  name: string;

  @Expose()
  hp: number;

  @Expose()
  attack: number;

  @Expose()
  defense: number;

  @Expose()
  specialAttack: number;

  @Expose()
  specialDefense: number;

  @Expose()
  speed: number;

  @Expose()
  baseStatTotal: number;

  @Expose()
  height: number;

  @Expose()
  weight: number;

  @Expose()
  sprite: string;

  @Expose()
  @Transform(({ obj }) => {
    if (!obj.name) {
      return '';
    }
    const sanitizedName = obj.name
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9-]/g, '')
      .toLowerCase();
    return `https://www.smogon.com/dex/media/sprites/xy/${sanitizedName}.gif`;
  })
  spriteUrl: string;

  @Expose()
  generationId: number;

  @Expose()
  @Type(() => GenerationOutputDto)
  generation: GenerationOutputDto;

  @Expose()
  @Type(() => PokemonTypeOutputDto)
  pokemonTypes: PokemonTypeOutputDto[];

  @Expose({ groups: ['pokemon.full'] })
  @Type(() => MoveOutputDto)
  moves: MoveOutputDto[];

  @Expose()
  @Type(() => AbilityOutputDto)
  abilities: AbilityOutputDto[];

  @Expose({ groups: ['pokemon.full'] })
  @Type(() => TypeEffectiveOutputDto)
  typeEffectiveness: TypeEffectiveOutputDto[];

  @Expose({ groups: ['pokemon.full'] })
  @Type(() => SeasonPokemonOutputDto)
  seasonPokemon: SeasonPokemonOutputDto[];
}

export class PokemonInputDto extends BaseInputDto {
  @Expose()
  @IsNumber()
  dexId: number;

  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsNumber()
  hp: number;

  @Expose()
  @IsNumber()
  attack: number;

  @Expose()
  @IsNumber()
  defense: number;

  @Expose()
  @IsNumber()
  specialAttack: number;

  @Expose()
  @IsNumber()
  specialDefense: number;

  @Expose()
  @IsNumber()
  speed: number;

  @Expose()
  @IsNumber()
  baseStatTotal: number;

  @Expose()
  @IsNumber()
  height: number;

  @Expose()
  @IsNumber()
  weight: number;

  @Expose()
  @IsString()
  sprite: string;

  @Expose()
  @IsNumber()
  generationId: number;
}
