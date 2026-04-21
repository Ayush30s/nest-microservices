import {
  IsInt,
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

///////////////////////////
// ENUMS
///////////////////////////

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  PENDING = 'PENDING',
}

export enum BookingStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  ATTENDED = 'ATTENDED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  UPI = 'UPI',
}

export enum PaymentStatus {
  SUCCESS = 'SUCCESS',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

///////////////////////////
// GYM DTO
///////////////////////////

export class CreateGymDto {
  @ApiProperty({
    example: 'FitZone Gym',
    description: 'Name of the gym',
  })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    example: 'Premium fitness center with cardio and strength zones',
    description: 'Gym description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/gym-image.jpg',
    description: 'Gym image URL',
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/gym-cover.jpg',
    description: 'Gym cover image URL',
  })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiProperty({
    example: 1,
    description: 'Owner user ID',
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  ownerId!: number;

  @ApiPropertyOptional({
    example: 500,
    description: 'Maximum number of gym members',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxMembers?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the gym is private',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isPrivate?: boolean;
}

///////////////////////////
// MEMBERSHIP DTO
///////////////////////////

export class CreateMembershipDto {
  @ApiProperty({
    example: 1,
    description: 'Gym ID',
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  gymId!: number;

  @ApiProperty({
    example: 'Gold Plan',
    description: 'Membership plan name',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    example: 'Access to all equipment and classes',
    description: 'Membership plan description',
  })
  @IsString()
  description!: string;

  @ApiProperty({
    example: 1999,
    description: 'Membership price',
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  price!: number;

  @ApiProperty({
    example: 30,
    description: 'Membership duration in days',
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  durationInDays!: number;
}

///////////////////////////
// SUBSCRIPTION DTO
///////////////////////////

export class CreateSubscriptionDto {
  @ApiProperty({
    example: 10,
    description: 'User ID',
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  userId!: number;

  @ApiProperty({
    example: 3,
    description: 'Membership plan ID',
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  planId!: number;

  @ApiPropertyOptional({
    example: '2026-04-21',
    description: 'Subscription start date',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    example: '2026-05-21',
    description: 'Subscription end date',
  })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({
    enum: SubscriptionStatus,
    enumName: 'SubscriptionStatus',
    example: SubscriptionStatus.ACTIVE,
    description: 'Subscription status',
  })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;
}

///////////////////////////
// GYM CLASS DTO
///////////////////////////

export class CreateGymClassDto {
  @ApiProperty({
    example: 1,
    description: 'Gym ID',
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  gymId!: number;

  @ApiProperty({
    example: 12,
    description: 'Trainer primary key',
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  trainerPk!: number;

  @ApiProperty({
    example: 'Morning Yoga',
    description: 'Class title',
  })
  @IsString()
  title!: string;

  @ApiProperty({
    example: 'A beginner-friendly yoga class',
    description: 'Class description',
  })
  @IsString()
  description!: string;

  @ApiProperty({
    example: '2026-04-22T06:00:00.000Z',
    description: 'Class start time',
  })
  @IsDateString()
  startTime!: string;

  @ApiProperty({
    example: '2026-04-22T07:00:00.000Z',
    description: 'Class end time',
  })
  @IsDateString()
  endTime!: string;

  @ApiProperty({
    example: 25,
    description: 'Maximum class capacity',
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  maxCapacity!: number;
}

///////////////////////////
// CLASS BOOKING DTO
///////////////////////////

export class CreateClassBookingDto {
  @ApiProperty({
    example: 5,
    description: 'Gym class ID',
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  classId!: number;

  @ApiProperty({
    example: 10,
    description: 'User ID',
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  userId!: number;

  @ApiProperty({
    enum: BookingStatus,
    enumName: 'BookingStatus',
    example: BookingStatus.CONFIRMED,
    description: 'Booking status',
  })
  @IsEnum(BookingStatus)
  bookingStatus!: BookingStatus;
}

///////////////////////////
// ATTENDANCE DTO
///////////////////////////

export class CreateAttendanceDto {
  @ApiProperty({
    example: 1,
    description: 'Gym ID',
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  gymId!: number;

  @ApiProperty({
    example: 10,
    description: 'User ID',
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  userId!: number;

  @ApiPropertyOptional({
    example: '2026-04-21T08:00:00.000Z',
    description: 'Check-in time',
  })
  @IsOptional()
  @IsDateString()
  checkInTime?: string;

  @ApiPropertyOptional({
    example: '2026-04-21T10:00:00.000Z',
    description: 'Check-out time',
  })
  @IsOptional()
  @IsDateString()
  checkOutTime?: string;
}

///////////////////////////
// PAYMENT DTO
///////////////////////////

export class CreatePaymentDto {
  @ApiProperty({
    example: 10,
    description: 'User ID',
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  userId!: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Subscription ID',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  subscriptionId?: number;

  @ApiProperty({
    example: 1999,
    description: 'Payment amount',
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  amount!: number;

  @ApiProperty({
    enum: PaymentMethod,
    enumName: 'PaymentMethod',
    example: PaymentMethod.UPI,
    description: 'Payment method',
  })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @ApiProperty({
    enum: PaymentStatus,
    enumName: 'PaymentStatus',
    example: PaymentStatus.SUCCESS,
    description: 'Payment status',
  })
  @IsEnum(PaymentStatus)
  paymentStatus!: PaymentStatus;

  @ApiPropertyOptional({
    example: '2026-04-21T12:00:00.000Z',
    description: 'Transaction date',
  })
  @IsOptional()
  @IsDateString()
  transactionDate?: string;
}

///////////////////////////
// SHIFT DTO
///////////////////////////

export class CreateShiftDto {
  @ApiProperty({
    example: 'Morning Shift',
    description: 'Shift name',
  })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    example: 'Strength training batch',
    description: 'Shift description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: '2026-04-22T06:00:00.000Z',
    description: 'Shift start time',
  })
  @IsDateString()
  startTime!: string;

  @ApiProperty({
    example: '2026-04-22T08:00:00.000Z',
    description: 'Shift end time',
  })
  @IsDateString()
  endTime!: string;

  @ApiPropertyOptional({
    example: 30,
    description: 'Maximum allowed members',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxMembers?: number;

  @ApiProperty({
    example: 1,
    description: 'Gym ID',
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  gymId!: number;

  @ApiPropertyOptional({
    example: 12,
    description: 'Trainer ID',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  trainerId?: number;

  @ApiPropertyOptional({
    example: 'MONDAY',
    description: 'Day of week for recurring shift',
  })
  @IsOptional()
  @IsString()
  dayOfWeek?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the shift is recurring',
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({
    example: 299,
    description: 'Shift price',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the shift is premium',
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPremium?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether booking is required',
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  bookingRequired?: boolean;
}

///////////////////////////
// TRAINER DTO
///////////////////////////

export class CreateTrainerDto {
  @ApiProperty({
    example: 12,
    description: 'Trainer user ID',
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  trainerId!: number;

  @ApiProperty({
    example: 'Weight Training',
    description: 'Trainer specialization',
  })
  @IsString()
  specialization!: string;

  @ApiProperty({
    example: 'Certified trainer with 5 years of experience',
    description: 'Trainer biography',
  })
  @IsString()
  bio!: string;

  @ApiProperty({
    example: 500,
    description: 'Hourly rate',
    minimum: 0,
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  hourlyRate!: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Years of experience',
    minimum: 0,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  experienceYears?: number;

  @ApiPropertyOptional({
    example: 4.5,
    description: 'Trainer rating',
    minimum: 0,
    maximum: 5,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;
}

///////////////////////////
// TRAINER GYM DTO
///////////////////////////

export class CreateTrainerGymDto {
  @ApiProperty({
    example: 12,
    description: 'Trainer primary key',
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  trainerPk!: number;

  @ApiProperty({
    example: 1,
    description: 'Gym ID',
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  gymId!: number;
}
