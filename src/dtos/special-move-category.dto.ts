import { Expose, Type } from 'class-transformer';
import { BaseOutputDto, BaseInputDto } from './base.dto';
import { IsString } from 'class-validator';
import { MoveOutputDto } from './move.dto';

export class SpecialMoveCategoryOutputDto extends BaseOutputDto {
  @Expose()
  name: string;

  @Expose({ groups: ['specialMoveCategory.full'] })
  @Type(() => MoveOutputDto)
  moves: MoveOutputDto[];
}

export class SpecialMoveCategoryInputDto extends BaseInputDto {
  @IsString()
  name: string;
}
