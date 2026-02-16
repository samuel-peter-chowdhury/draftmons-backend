import { Expose, Type } from 'class-transformer';
import { BaseOutputDto, BaseInputDto } from './base.dto';
import { IsNumber, IsString } from 'class-validator';
import { SeasonOutputDto } from './season.dto';
import { SeasonPokemonTeamOutputDto } from './season-pokemon-team.dto';
import { GameOutputDto } from './game.dto';
import { UserOutputDto } from './user.dto';
import { MatchOutputDto } from './match.dto';

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
  @Type(() => SeasonPokemonTeamOutputDto)
  seasonPokemonTeams: SeasonPokemonTeamOutputDto[];

  @Expose({ groups: ['team.full'] })
  @Type(() => GameOutputDto)
  lostGames: GameOutputDto[];

  @Expose({ groups: ['team.full'] })
  @Type(() => GameOutputDto)
  wonGames: GameOutputDto[];

  @Expose({ groups: ['team.full'] })
  @Type(() => MatchOutputDto)
  matches: MatchOutputDto[];

  @Expose({ groups: ['team.full'] })
  @Type(() => MatchOutputDto)
  lostMatches: MatchOutputDto[];

  @Expose({ groups: ['team.full'] })
  @Type(() => MatchOutputDto)
  wonMatches: MatchOutputDto[];
}

export class TeamInputDto extends BaseInputDto {
  @IsString()
  name: string;

  @IsNumber()
  seasonId: number;

  @IsNumber()
  userId: number;
}
