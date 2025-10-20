import { Expose, Type } from 'class-transformer';
import { BaseOutputDto, BaseInputDto } from './base.dto';
import { IsNumber } from 'class-validator';
import { GameOutputDto } from './game.dto';
import { SeasonPokemonOutputDto } from './season-pokemon.dto';

export class GameStatOutputDto extends BaseOutputDto {
  @Expose()
  gameId: number;

  @Expose()
  seasonPokemonId: number;

  @Expose()
  directKills: number;

  @Expose()
  indirectKills: number;

  @Expose()
  deaths: number;

  @Expose({ groups: ['gameStat.full'] })
  @Type(() => GameOutputDto)
  game: GameOutputDto;

  @Expose({ groups: ['gameStat.full'] })
  @Type(() => SeasonPokemonOutputDto)
  seasonPokemon: SeasonPokemonOutputDto;
}

export class GameStatInputDto extends BaseInputDto {
  @IsNumber()
  gameId: number;

  @IsNumber()
  seasonPokemonId: number;

  @IsNumber()
  directKills: number;

  @IsNumber()
  indirectKills: number;

  @IsNumber()
  deaths: number;
}
