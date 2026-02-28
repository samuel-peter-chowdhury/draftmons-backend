import { Expose, Type } from 'class-transformer';
import { BaseOutputDto, BaseInputDto } from './base.dto';
import { IsNumber, IsString } from 'class-validator';
import { GenerationOutputDto } from './generation.dto';

export class ItemOutputDto extends BaseOutputDto {
  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  generationId: number;

  @Expose()
  @Type(() => GenerationOutputDto)
  generation: GenerationOutputDto;
}

export class ItemInputDto extends BaseInputDto {
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
