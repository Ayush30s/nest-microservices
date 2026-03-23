import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  IsDateString,
  ValidateNested,
  Length,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  TRAINER = 'TRAINER',
}

export class AddressDto {
  @IsString()
  state!: string;

  @IsString()
  city!: string;

  @IsString()
  @Length(6, 6)
  pincode!: string;
}

export class ProfileDto {
  @IsString()
  gender!: string;

  @IsDateString()
  dob!: string;

  @IsInt()
  heightCm!: number;

  @IsInt()
  weightKg!: number;

  @IsString()
  profileImageUrl!: string;

  @IsString()
  address!: string;

  @IsString()
  bio!: string;

  @IsString()
  contact_no!: string;
}

export class UserSessionDto {
  @IsString()
  ipAddress!: string;

  @IsString()
  device!: string;

  @IsString()
  platform!: string;

  @IsString()
  refreshTokenHash!: string;

  @IsDateString()
  expiresAt!: string;
}

export class UserFollowDto {
  @IsInt()
  followerId!: number;

  @IsInt()
  followingId!: number;
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
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

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
  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

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
