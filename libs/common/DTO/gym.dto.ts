import {
  IsInt,
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsEmail,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

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
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @Type(() => Number)
  @IsInt()
  ownerId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxMembers?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isPrivate?: boolean;
}

///////////////////////////
// MEMBERSHIP DTO
///////////////////////////

export class CreateMembershipDto {
  @Type(() => Number)
  @IsInt()
  gymId!: number;

  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @Type(() => Number)
  @IsInt()
  price!: number;

  @Type(() => Number)
  @IsInt()
  durationInDays!: number;
}

///////////////////////////
// SUBSCRIPTION DTO
///////////////////////////

export class CreateSubscriptionDto {
  @Type(() => Number)
  @IsInt()
  userId!: number;

  @Type(() => Number)
  @IsInt()
  planId!: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;
}

///////////////////////////
// GYM CLASS DTO
///////////////////////////

export class CreateGymClassDto {
  @Type(() => Number)
  @IsInt()
  gymId!: number;

  @Type(() => Number)
  @IsInt()
  trainerPk!: number;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @Type(() => Number)
  @IsInt()
  maxCapacity!: number;
}

///////////////////////////
// CLASS BOOKING DTO
///////////////////////////

export class CreateClassBookingDto {
  @Type(() => Number)
  @IsInt()
  classId!: number;

  @Type(() => Number)
  @IsInt()
  userId!: number;

  @IsEnum(BookingStatus)
  bookingStatus!: BookingStatus;
}

///////////////////////////
// ATTENDANCE DTO
///////////////////////////

export class CreateAttendanceDto {
  @Type(() => Number)
  @IsInt()
  gymId!: number;

  @Type(() => Number)
  @IsInt()
  userId!: number;

  @IsOptional()
  @IsDateString()
  checkInTime?: string;

  @IsOptional()
  @IsDateString()
  checkOutTime?: string;
}

///////////////////////////
// PAYMENT DTO
///////////////////////////

export class CreatePaymentDto {
  @Type(() => Number)
  @IsInt()
  userId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  subscriptionId?: number;

  @Type(() => Number)
  @IsInt()
  amount!: number;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsEnum(PaymentStatus)
  paymentStatus!: PaymentStatus;

  @IsOptional()
  @IsDateString()
  transactionDate?: string;
}

export class CreateShiftDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsOptional()
  @IsInt()
  maxMembers?: number;

  @IsInt()
  gymId!: number;

  @IsOptional()
  @IsInt()
  trainerId?: number;

  @IsOptional()
  @IsString()
  dayOfWeek?: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @IsOptional()
  @IsBoolean()
  bookingRequired?: boolean;
}

export class CreateTrainerDto {
  @IsInt()
  trainerId!: number;

  @IsString()
  specialization!: string;

  @IsString()
  bio!: string;

  @IsInt()
  @Min(0)
  hourlyRate!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  experienceYears?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;
}

///////////////////////////
// TRAINER GYM DTO
///////////////////////////

export class CreateTrainerGymDto {
  @Type(() => Number)
  @IsInt()
  trainerPk!: number;

  @Type(() => Number)
  @IsInt()
  gymId!: number;
}
