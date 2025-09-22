import { Expose, Type } from "class-transformer";
import { BaseOutputDto, BaseInputDto } from "./base.dto";
import { IsNumber, IsOptional, IsString } from "class-validator";
import { PokemonOutputDto } from "./pokemon.dto";
import { GameStatOutputDto } from "./game-stat.dto";
import { SeasonOutputDto } from "./season.dto";
import { TeamOutputDto } from "./team.dto";

export class SeasonPokemonOutputDto extends BaseOutputDto {
  @Expose()
  seasonId: number;

  @Expose()
  pokemonId: number;

  @Expose()
  teamId: number;

  @Expose()
  condition: string;

  @Expose()
  pointValue: number;

  @Expose({ groups: ['seasonPokemon.full'] })
  @Type(() => SeasonOutputDto)
  season: SeasonOutputDto;

  @Expose({ groups: ['seasonPokemon.full'] })
  @Type(() => PokemonOutputDto)
  pokemon: PokemonOutputDto;

  @Expose({ groups: ['seasonPokemon.full'] })
  @Type(() => TeamOutputDto)
  team: TeamOutputDto;

  @Expose({ groups: ['seasonPokemon.full'] })
  @Type(() => GameStatOutputDto)
  gameStats: GameStatOutputDto[];
}

export class SeasonPokemonInputDto extends BaseInputDto {
  @IsNumber()
  seasonId: number;

  @IsNumber()
  pokemonId: number;

  @IsOptional()
  @IsNumber()
  teamId: number;

  @IsOptional()
  @IsString()
  condition: string;

  @IsOptional()
  @IsNumber()
  pointValue: number;
}
