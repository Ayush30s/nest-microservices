import {
  IsString,
  MinLength,
  IsOptional,
  IsInt,
  IsDateString,
  ValidateNested,
  Length,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';

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
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  gender?: string;

  @IsDateString()
  dob?: string;

  @Type(() => Number)
  @IsInt()
  heightCm?: number;

  @Type(() => Number)
  @IsInt()
  weightKg?: number;

  @IsOptional()
  @IsString()
  profileImageUrl?: string;

  @IsString()
  address?: string;

  @IsString()
  bio?: string;

  @IsString()
  @Length(10, 10)
  contact_no?: string;
}

// Notice how lean this is now! No Auth-related fields.
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @IsOptional()
  @IsString()
  profileImageUrl?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProfileDto)
  profile?: ProfileDto;
}

export class UserFollowDto {
  @Type(() => Number)
  @IsInt()
  followerId!: number;

  @Type(() => Number)
  @IsInt()
  followingId!: number;
}

export class CreateFollowDto {
  @Type(() => Number)
  @IsInt()
  followingId!: number;
}

export class UnfollowDto {
  @Type(() => Number)
  @IsInt()
  followingId!: number;
}
