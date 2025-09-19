import { Expose, Type } from "class-transformer";
import { BaseOutputDto } from "./base-output.dto";
import { IsNumber, IsString } from "class-validator";
import { BaseInputDto } from "./base-input.dto";
import { SeasonOutputDto } from "./season.dto";
import { SeasonPokemonOutputDto } from "./season-pokemon.dto";
import { MatchTeamOutputDto } from "./match-team.dto";
import { GameOutputDto } from "./game.dto";
import { UserOutputDto } from "./user.dto";

export class TeamOutputDto extends BaseOutputDto {
  @Expose()
  name: string;

  @Expose()
  seasonId: number;

  @Expose()
  userId: number;

  @Expose({ groups: ['team.full'] })
  @Type(() => SeasonOutputDto)
  season: SeasonOutputDto;

  @Expose({ groups: ['team.full'] })
  @Type(() => UserOutputDto)
  user: UserOutputDto;

  @Expose({ groups: ['team.full'] })
  @Type(() => SeasonPokemonOutputDto)
  seasonPokemon: SeasonPokemonOutputDto[];

  @Expose({ groups: ['team.full'] })
  @Type(() => MatchTeamOutputDto)
  matchTeams: MatchTeamOutputDto[];

  @Expose({ groups: ['team.full'] })
  @Type(() => GameOutputDto)
  wonGames: GameOutputDto[];
}

export class TeamInputDto extends BaseInputDto {
  @IsString()
  name: string;

  @IsNumber()
  seasonId: number;

  @IsNumber()
  userId: number;
}
