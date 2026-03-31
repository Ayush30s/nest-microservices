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
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  gender!: string;

  @IsDateString()
  dob!: string;

  @Type(() => Number) // 🔥 auto transform
  @IsInt()
  heightCm!: number;

  @Type(() => Number)
  @IsInt()
  weightKg!: number;

  @IsOptional() // ✅ FIXED
  @IsString()
  profileImageUrl?: string;

  @IsString()
  address!: string;

  @IsString()
  bio!: string;

  @IsString()
  @Length(10, 10)
  contact_no!: string;
}

// ================= USER SESSION DTO =================
export class UserSessionDto {
  @IsString()
  apAddress!: string;

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
  @Type(() => Number)
  @IsInt()
  followerId!: number;

  @Type(() => Number)
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
  @Type(() => Number)
  @IsInt()
  followingId!: number;
}

// ================= UNFOLLOW DTO =================
export class UnfollowDto {
  @Type(() => Number)
  @IsInt()
  followingId!: number;
}
