// libs/common/DTO/message.dto.ts
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsEnum,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { WsException } from '@nestjs/websockets';
import { ValidationPipe, ValidationError } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  @ApiProperty({
    example: 'Hello, how are you?',
    description: 'Message content',
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000, { message: 'Message content cannot exceed 5000 characters' })
  content!: string;

  @ApiPropertyOptional({
    enum: MessageType,
    enumName: 'MessageType',
    example: MessageType.TEXT,
    description: 'Message type',
    default: MessageType.TEXT,
  })
  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType = MessageType.TEXT;

  @ApiPropertyOptional({
    example: 'general-room',
    description: 'Room ID',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  roomId?: string;

  @ApiPropertyOptional({
    example: 'user_123',
    description: 'Recipient user ID for direct messaging',
  })
  @IsString()
  @IsOptional()
  recipientId?: string;

  @ApiPropertyOptional({
    example: {
      fileName: 'invoice.pdf',
      fileSize: 102400,
      mimeType: 'application/pdf',
    },
    description: 'Additional metadata for the message',
    type: 'object',
    additionalProperties: true,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

// Join Room DTO
export class JoinRoomDto {
  @ApiProperty({
    example: 'fitness-chat-room',
    description: 'Room ID to join',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: 'Room ID is required' })
  @MaxLength(50, { message: 'Room ID cannot exceed 50 characters' })
  roomId!: string;

  @ApiPropertyOptional({
    example: 'secret-room-password',
    description: 'Optional room password',
  })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({
    example: {
      source: 'mobile-app',
      version: '1.0.0',
    },
    description: 'Additional room join metadata',
    type: 'object',
    additionalProperties: true,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

// Leave Room DTO
export class LeaveRoomDto {
  @ApiProperty({
    example: 'fitness-chat-room',
    description: 'Room ID to leave',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: 'Room ID is required' })
  @MaxLength(50, { message: 'Room ID cannot exceed 50 characters' })
  roomId!: string;
}

// Typing Indicator DTO
export class TypingDto {
  @ApiProperty({
    example: 'fitness-chat-room',
    description: 'Room ID',
  })
  @IsString()
  @IsNotEmpty()
  roomId!: string;

  @ApiProperty({
    example: true,
    description: 'Whether the user is currently typing',
    type: Boolean,
  })
  @IsBoolean()
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
