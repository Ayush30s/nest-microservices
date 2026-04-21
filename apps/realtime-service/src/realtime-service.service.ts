// apps/realtime-service/src/realtime-service.service.ts
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import { MESSAGE_PATTERNS } from 'libs/common/contants/event';

@Injectable()
export class RealtimeServiceService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RealtimeServiceService.name);
  private redisPublisher!: RedisClientType;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.redisPublisher = createClient({
      url: this.configService.get<string>('REDIS_URL'),
    }) as RedisClientType;

    this.redisPublisher.on('error', (err) =>
      this.logger.error('Redis publisher error:', err),
    );

    await this.redisPublisher.connect();
    this.logger.log('Redis publisher connected');
  }

  async onModuleDestroy() {
    await this.redisPublisher?.quit();
  }

  // Called by controller @MessagePattern — gateway .send() → returns response
  async processMessage(data: any) {
    this.logger.log(`Processing message from ${data.senderId} in room ${data.roomId}`);

    const messageId = `msg_${Date.now()}`;

    // Publish to Redis → gateway subscriber picks it up → emits to Socket.IO room
    await this.publish(MESSAGE_PATTERNS.BROADCAST_MESSAGE, {
      messageId,
      roomId: data.roomId,
      senderId: data.senderId,
      content: data.content,
      timestamp: new Date().toISOString(),
    });

    return { messageId }; // returned back to gateway via TCP response
  }

  async processJoinRoom(data: any) {
    this.logger.log(`User ${data.userId} joined room ${data.roomId}`);

    await this.publish(MESSAGE_PATTERNS.BROADCAST_USER_JOINED, {
      userId: data.userId,
      roomId: data.roomId,
      timestamp: new Date().toISOString(),
    });

    return { status: 'joined' };
  }

  async processLeaveRoom(data: any) {
    this.logger.log(`User ${data.userId} left room(s)`);

    if (data.rooms?.length) {
      for (const roomId of data.rooms) {
        await this.publish(MESSAGE_PATTERNS.BROADCAST_USER_LEFT, {
          userId: data.userId,
          roomId,
          reason: data.reason,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return { status: 'left' };
  }

  async processTyping(data: any) {
    await this.publish(MESSAGE_PATTERNS.BROADCAST_TYPING, {
      userId: data.userId,
      roomId: data.roomId,
      timestamp: new Date().toISOString(),
    });
  }

  // ========================
  // Private
  // ========================
  private async publish(channel: string, data: any) {
    await this.redisPublisher.publish(channel, JSON.stringify(data));
  }
}