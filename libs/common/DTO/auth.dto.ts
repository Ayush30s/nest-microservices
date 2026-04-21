import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AddressDto, ProfileDto } from './user.dto';

export class RoleDto {
  @ApiProperty({
    example: 'USER',
    description: 'User role name',
  })
  @IsString()
  name!: string; // USER, ADMIN, TRAINER
}

export class UserSessionDto {
  @ApiProperty({
    example: '192.168.1.10',
    description: 'Client IP address',
  })
  @IsString()
  ipAddress!: string;

  @ApiProperty({
    example: 'Chrome',
    description: 'Client device/browser name',
  })
  @IsString()
  device!: string;

  @ApiProperty({
    example: 'Windows',
    description: 'Client platform or OS',
  })
  @IsString()
  platform!: string;

  @ApiProperty({
    example: 'hashed_refresh_token_value',
    description: 'Hashed refresh token',
  })
  @IsString()
  refreshTokenHash!: string;

  @ApiProperty({
    example: '2026-12-31T23:59:59.000Z',
    description: 'Refresh token expiry date',
  })
  @IsDateString()
  expiresAt!: string;
}

export class RegisterDTO {
  @ApiProperty({
    example: 'john@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Full name of the user',
    minLength: 3,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @ApiProperty({
    example: 'secret123',
    description: 'User password',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/profile.jpg',
    description: 'Profile image URL',
  })
  @IsOptional()
  @IsString()
  profileImageUrl?: string;

  @ApiPropertyOptional({
    example: 'USER',
    description: 'Role assigned to the user',
  })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the account is active',
    default: true,
  })
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the email is verified',
    default: false,
  })
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;

  @ApiPropertyOptional({
    type: () => AddressDto,
    description: 'User address details',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({
    type: () => ProfileDto,
    description: 'User profile details',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProfileDto)
  profile?: ProfileDto;
}

export class SigninDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'secret123',
    description: 'User password',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}
