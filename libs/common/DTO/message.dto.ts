// libs/common/DTO/message.dto.ts
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsEnum,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WsException } from '@nestjs/websockets';
import { ValidationPipe, ValidationError } from '@nestjs/common';

// Message Types Enum
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
  NOTIFICATION = 'notification',
}

// Send Message DTO
export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000, { message: 'Message content cannot exceed 5000 characters' })
  content!: string;

  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType = MessageType.TEXT;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  roomId?: string;

  @IsString()
  @IsOptional()
  recipientId?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

// Join Room DTO
export class JoinRoomDto {
  @IsString()
  @IsNotEmpty({ message: 'Room ID is required' })
  @MaxLength(50, { message: 'Room ID cannot exceed 50 characters' })
  roomId!: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

// Leave Room DTO
export class LeaveRoomDto {
  @IsString()
  @IsNotEmpty({ message: 'Room ID is required' })
  @MaxLength(50, { message: 'Room ID cannot exceed 50 characters' })
  roomId!: string;
}

// Typing Indicator DTO
export class TypingDto {
  @IsString()
  @IsNotEmpty()
  roomId!: string;

  @IsNotEmpty()
  isTyping!: boolean;
}

// WebSocket Validation Pipe
export class WsValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const messages = errors.map((error) => ({
          field: error.property,
          constraints: error.constraints,
          value: error.value,
        }));

        return new WsException({
          message: 'Validation failed',
          errors: messages,
          timestamp: new Date().toISOString(),
        });
      },
    });
  }
}
