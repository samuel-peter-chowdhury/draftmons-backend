import { Expose } from 'class-transformer';
import { IsEmail, IsString, IsOptional, IsBoolean } from 'class-validator';

// User response DTO with transformation groups
export class UserDto {
  @Expose()
  id: number;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  email: string;

  @Expose({ groups: ['user.admin'] })
  isAdmin: boolean;

  @Expose()
  showdownUsername: string | null;

  @Expose()
  discordUsername: string | null;

  @Expose()
  timezone: string | null;

  @Expose({ groups: ['user.full'] })
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  @Expose({ groups: ['user.full'] })
  createdAt: Date;

  @Expose({ groups: ['user.full'] })
  updatedAt: Date;
}

// DTO for creating a user
export class CreateUserDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  showdownUsername?: string;

  @IsOptional()
  @IsString()
  discordUsername?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

// DTO for updating a user
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  showdownUsername?: string;

  @IsOptional()
  @IsString()
  discordUsername?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

// DTO for Google OAuth user
export class GoogleUserDto {
  @IsString()
  googleId: string;

  @IsEmail()
  email: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;
}

// Admin update user DTO with additional fields
export class AdminUpdateUserDto extends UpdateUserDto {
  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;
}
