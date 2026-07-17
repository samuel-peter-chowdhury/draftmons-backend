import { IsBoolean, IsEmail, IsOptional } from 'class-validator';

export class DevLoginInputDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;
}
