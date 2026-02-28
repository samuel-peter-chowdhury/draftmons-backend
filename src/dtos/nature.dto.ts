import { Expose } from 'class-transformer';
import { BaseOutputDto, BaseInputDto } from './base.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { StatType } from '../entities/nature.entity';

export class NatureOutputDto extends BaseOutputDto {
  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  positiveStat: StatType | null;

  @Expose()
  negativeStat: StatType | null;
}

export class NatureInputDto extends BaseInputDto {
  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsString()
  description: string;

  @Expose()
  @IsOptional()
  @IsEnum(StatType)
  positiveStat: StatType | null;

  @Expose()
  @IsOptional()
  @IsEnum(StatType)
  negativeStat: StatType | null;
}
