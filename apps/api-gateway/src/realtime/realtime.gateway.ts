// apps/api-gateway/realtime/gateway/realtime.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, Logger, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { MESSAGE_PATTERNS, REALTIME_EVENTS } from 'libs/common/contants/event';
import { WsJwtGuard } from 'libs/common/auth/jwt-ws-guard';
import {
  WsValidationPipe,
  SendMessageDto,
  JoinRoomDto,
  LeaveRoomDto,
} from 'libs/common/DTO/message.dto';

// ========================
// Interfaces & Types
// ========================
interface ClientData {
  userId: string;
  rooms: Set<string>;
}

interface MessageResult {
  messageId: string;
}

// ========================
// Gateway Configuration
// ========================
@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
    ],
    credentials: true,
  },
  namespace: '/realtime',
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
  maxHttpBufferSize: 1e6,
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private connectedClients = new Map<string, ClientData>();

  constructor(
    @Inject('REALTIME_SERVICE') private readonly realtimeClient: ClientProxy,
  ) {}

  // ========================
  // Lifecycle Hooks
  // ========================
  afterInit(server: Server) {
    this.logger.log('Realtime WebSocket Gateway initialized');
    this.subscribeToMicroserviceBroadcasts();
  }

  @UseGuards(WsJwtGuard)
  async handleConnection(client: Socket) {
    try {
      const userId = this.extractUserIdFromClient(client);

      this.storeClient(client.id, userId);
      await client.join(this.getUserRoom(userId));

      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);
      this.sendConnectionSuccess(client, userId);
    } catch (error) {
      this.logger.error(`Connection error for ${client.id}:`, error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const clientData = this.connectedClients.get(client.id);

    if (clientData) {
      this.notifyMicroserviceOfLeave(clientData);
      this.connectedClients.delete(client.id);
      this.logger.log(
        `Client disconnected: ${client.id} (Remaining: ${this.connectedClients.size})`,
      );
    }
  }

  // ========================
  // WebSocket Event Handlers
  // ========================
  @UseGuards(WsJwtGuard)
  @SubscribeMessage(REALTIME_EVENTS.SEND_MESSAGE)
  async handleMessage(
    @MessageBody(new WsValidationPipe()) data: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = this.extractUserIdFromClient(client);
      const result = await this.sendToMicroservice<MessageResult>(
        MESSAGE_PATTERNS.PROCESS_MESSAGE,
        {
          ...data,
          senderId: userId,
          socketId: client.id,
        },
      );

      return {
        status: 'success',
        messageId: result.messageId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error processing message:', error);
      throw new WsException('Failed to process message');
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(REALTIME_EVENTS.JOIN_ROOM)
  async handleJoinRoom(
    @MessageBody(new WsValidationPipe()) data: JoinRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = this.extractUserIdFromClient(client);
      const roomName = this.getRoomName(data.roomId);

      await client.join(roomName);
      this.trackRoomMembership(client.id, data.roomId, 'add');

      await this.sendToMicroservice(MESSAGE_PATTERNS.PROCESS_JOIN_ROOM, {
        userId,
        roomId: data.roomId,
        socketId: client.id,
      });

      return {
        status: 'success',
        roomId: data.roomId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error joining room:', error);
      throw new WsException('Failed to join room');
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(REALTIME_EVENTS.LEAVE_ROOM)
  async handleLeaveRoom(
    @MessageBody(new WsValidationPipe()) data: LeaveRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = this.extractUserIdFromClient(client);
      const roomName = this.getRoomName(data.roomId);

      await client.leave(roomName);
      this.trackRoomMembership(client.id, data.roomId, 'delete');

      await this.sendToMicroservice(MESSAGE_PATTERNS.PROCESS_LEAVE_ROOM, {
        userId,
        roomId: data.roomId,
        socketId: client.id,
      });

      return {
        status: 'success',
        roomId: data.roomId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error leaving room:', error);
      throw new WsException('Failed to leave room');
    }
  }

  // ========================
  // Microservice Broadcast Handlers
  // ========================
  private subscribeToMicroserviceBroadcasts() {
    this.realtimeClient
      .send({ cmd: MESSAGE_PATTERNS.BROADCAST_MESSAGE }, {})
      .subscribe((data) => this.handleBroadcastMessage(data));

    this.realtimeClient
      .send({ cmd: MESSAGE_PATTERNS.BROADCAST_USER_JOINED }, {})
      .subscribe((data) => this.handleUserJoined(data));

    this.realtimeClient
      .send({ cmd: MESSAGE_PATTERNS.BROADCAST_USER_LEFT }, {})
      .subscribe((data) => this.handleUserLeft(data));

    this.realtimeClient
      .send({ cmd: MESSAGE_PATTERNS.BROADCAST_TYPING }, {})
      .subscribe((data) => this.handleUserTyping(data));
  }

  private handleBroadcastMessage(data: any) {
    if (data.roomId) {
      this.server
        .to(this.getRoomName(data.roomId))
        .emit(REALTIME_EVENTS.RECEIVE_MESSAGE, data);
    } else if (data.userId) {
      this.server
        .to(this.getUserRoom(data.userId))
        .emit(REALTIME_EVENTS.RECEIVE_MESSAGE, data);
    } else {
      this.server.emit(REALTIME_EVENTS.RECEIVE_MESSAGE, data);
    }
  }

  private handleUserJoined(data: any) {
    this.server
      .to(this.getRoomName(data.roomId))
      .emit(REALTIME_EVENTS.USER_JOINED, data);
  }

  private handleUserLeft(data: any) {
    this.server
      .to(this.getRoomName(data.roomId))
      .emit(REALTIME_EVENTS.USER_LEFT, data);
  }

  private handleUserTyping(data: any) {
    this.server
      .to(this.getRoomName(data.roomId))
      .emit(REALTIME_EVENTS.USER_TYPING, data);
  }

  // ========================
  // Public Utility Methods
  // ========================
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(this.getUserRoom(userId)).emit(event, data);
  }

  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // ========================
  // Private Helpers
  // ========================
  private extractUserIdFromClient(client: Socket): string {
    return client.data.user.sub;
  }

  private storeClient(socketId: string, userId: string) {
    this.connectedClients.set(socketId, {
      userId,
      rooms: new Set<string>(),
    });
  }

  private trackRoomMembership(
    socketId: string,
    roomId: string,
    action: 'add' | 'delete',
  ) {
    const clientData = this.connectedClients.get(socketId);
    if (!clientData) return;

    if (action === 'add') {
      clientData.rooms.add(roomId);
    } else {
      clientData.rooms.delete(roomId);
    }
  }

  private notifyMicroserviceOfLeave(clientData: ClientData) {
    this.realtimeClient.emit(MESSAGE_PATTERNS.PROCESS_LEAVE_ROOM, {
      userId: clientData.userId,
      rooms: Array.from(clientData.rooms),
      reason: 'disconnect',
    });
  }

  private async sendToMicroservice<T>(pattern: string, data: any): Promise<T> {
    return firstValueFrom(this.realtimeClient.send<T>(pattern, data));
  }

  private sendConnectionSuccess(client: Socket, userId: string) {
    client.emit('connected', {
      status: 'success',
      socketId: client.id,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  // Room naming conventions
  private getUserRoom(userId: string): string {
    return `user:${userId}`;
  }

  private getRoomName(roomId: string): string {
    return `room:${roomId}`;
  }
}
