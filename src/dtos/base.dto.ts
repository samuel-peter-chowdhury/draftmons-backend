import { Expose } from 'class-transformer';

export abstract class BaseOutputDto {
  @Expose()
  id: number;

  @Expose()
  isActive: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

export abstract class BaseInputDto {}
