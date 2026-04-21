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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddressDto {
  @ApiProperty({
    example: 'Maharashtra',
    description: 'State name',
  })
  @IsString()
  state!: string;

  @ApiProperty({
    example: 'Pune',
    description: 'City name',
  })
  @IsString()
  city!: string;

  @ApiProperty({
    example: '411001',
    description: '6-digit pincode',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6)
  pincode!: string;
}

export class ProfileDto {
  @ApiPropertyOptional({
    example: 'profile_123',
    description: 'Profile ID',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({
    example: 'john@example.com',
    description: 'Profile email',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Profile name',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'Male',
    description: 'Gender',
  })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({
    example: '1998-05-10',
    description: 'Date of birth',
  })
  @IsOptional()
  @IsDateString()
  dob?: string;

  @ApiPropertyOptional({
    example: 175,
    description: 'Height in centimeters',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  heightCm?: number;

  @ApiPropertyOptional({
    example: 72,
    description: 'Weight in kilograms',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  weightKg?: number;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/profile.jpg',
    description: 'Profile image URL',
  })
  @IsOptional()
  @IsString()
  profileImageUrl?: string;

  @ApiPropertyOptional({
    example: 'Pune, Maharashtra',
    description: 'Address as plain text',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: 'Fitness enthusiast and coach',
    description: 'Short biography',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    example: '9876543210',
    description: '10-digit contact number',
    minLength: 10,
    maxLength: 10,
  })
  @IsOptional()
  @IsString()
  @Length(10, 10)
  contact_no?: string;
}

// Notice how lean this is now! No Auth-related fields.
export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Updated user name',
    minLength: 3,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/new-profile.jpg',
    description: 'Updated profile image URL',
  })
  @IsOptional()
  @IsString()
  profileImageUrl?: string;

  @ApiPropertyOptional({
    type: () => AddressDto,
    description: 'Updated address details',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({
    type: () => ProfileDto,
    description: 'Updated profile details',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProfileDto)
  profile?: ProfileDto;
}

export class UserFollowDto {
  @ApiProperty({
    example: 10,
    description: 'Follower user ID',
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  followerId!: number;

  @ApiProperty({
    example: 22,
    description: 'Following user ID',
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  followingId!: number;
}

export class CreateFollowDto {
  @ApiProperty({
    example: 22,
    description: 'User ID to follow',
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  followingId!: number;
}

export class UnfollowDto {
  @ApiProperty({
    example: 22,
    description: 'User ID to unfollow',
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  followingId!: number;
}
