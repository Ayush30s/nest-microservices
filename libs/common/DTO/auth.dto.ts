import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsBoolean,
  IsInt,
  IsDateString,
  ValidateNested,
  Length,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

// ================= ROLE DTO =================
export class RoleDto {
  @IsString()
  name!: string; // USER, ADMIN, TRAINER
}

// ================= ADDRESS DTO =================
export class AddressDto {
  @IsString()
  state!: string;

  @IsString()
  city!: string;

  @IsString()
  @Length(6, 6)
  pincode!: string;
}

// ================= PROFILE DTO =================
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

// ================= USER SESSION DTO =================
export class UserSessionDto {
  @IsString()
  apAddress!: string; // match schema

  @IsString()
  device!: string;

  @IsString()
  platform!: string;

  @IsString()
  refreshTokenHash!: string;

  @IsDateString()
  expiresAt!: string;
}

// ================= USER FOLLOW DTO =================
export class UserFollowDto {
  @IsInt()
  followerId!: number;

  @IsInt()
  followingId!: number;
}

// ================= REGISTER DTO =================
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
  role?: string; // will match Role.name in DB

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

  @IsOptional()
  @ValidateNested()
  @Type(() => UserSessionDto)
  session?: UserSessionDto;
}

// ================= LOGIN DTO =================
export class SigninDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}

// ================= UPDATE USER DTO =================
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @IsOptional()
  @IsString()
  role?: string;

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

// ================= CREATE FOLLOW DTO =================
export class CreateFollowDto {
  @IsInt()
  followingId!: number;
}

// ================= UNFOLLOW DTO =================
export class UnfollowDto {
  @IsInt()
  followingId!: number;
}
