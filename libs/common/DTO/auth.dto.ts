import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AddressDto, ProfileDto } from './user.dto';

// (You may need to import AddressDto and ProfileDto here if they are in a shared lib,
// or define them here if you aren't using a shared lib yet)

export class RoleDto {
  @IsString()
  name!: string; // USER, ADMIN, TRAINER
}

export class UserSessionDto {
  @IsString()
  ipAddress!: string; // Fixed typo from 'apAddress'

  @IsString()
  device!: string;

  @IsString()
  platform!: string;

  @IsString()
  refreshTokenHash!: string;

  @IsString() // Changed from IsDateString if you are handling Date objects directly, but IsDateString is fine if receiving JSON
  expiresAt!: string;
}

export class RegisterDTO {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  profileImageUrl?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProfileDto)
  profile?: ProfileDto;
}

export class SigninDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}
