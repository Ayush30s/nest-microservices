import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { MESSAGE_PATTERNS } from 'libs/common/contants/event';

@Injectable()
export class RealtimeServiceService {
  constructor(
    @Inject('API_GATEWAY') private readonly gatewayClient: ClientProxy,
  ) {}

  async processMessage(data: any) {
    // Business logic: save to database, validate, etc.
    const enrichedMessage = {
      ...data,
      id: this.generateMessageId(),
      processedAt: new Date().toISOString(),
    };

    // Broadcast back to gateway for distribution
    this.gatewayClient.emit(
      MESSAGE_PATTERNS.BROADCAST_MESSAGE,
      enrichedMessage,
    );

    return { messageId: enrichedMessage.id };
  }

  async processJoinRoom(data: any) {
    // Business logic: update room state, notify others
    const joinData = {
      ...data,
      timestamp: new Date().toISOString(),
    };

    this.gatewayClient.emit(MESSAGE_PATTERNS.BROADCAST_USER_JOINED, joinData);
    return { success: true };
  }

  async processLeaveRoom(data: any) {
    // Business logic: clean up resources
    const leaveData = {
      ...data,
      timestamp: new Date().toISOString(),
    };

    this.gatewayClient.emit(MESSAGE_PATTERNS.BROADCAST_USER_LEFT, leaveData);
    return { success: true };
  }

  async processTyping(data: any) {
    this.gatewayClient.emit(MESSAGE_PATTERNS.BROADCAST_TYPING, data);
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
