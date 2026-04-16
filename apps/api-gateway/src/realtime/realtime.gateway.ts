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

// Interface for connected client data
interface ClientData {
  userId: string;
  rooms: Set<string>;
}

// Interface for message result
interface MessageResult {
  messageId: string;
}

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

  afterInit(server: Server) {
    this.logger.log('Realtime WebSocket Gateway initialized');

    this.realtimeClient.send(
      { cmd: MESSAGE_PATTERNS.BROADCAST_MESSAGE },
      (data: any) => {
        this.handleBroadcastMessage(data);
      },
    );

    this.realtimeClient.send(
      { cmd: MESSAGE_PATTERNS.BROADCAST_USER_JOINED },
      (data: any) => {
        this.handleUserJoined(data);
      },
    );

    this.realtimeClient.send(
      { cmd: MESSAGE_PATTERNS.BROADCAST_USER_LEFT },
      (data: any) => {
        this.handleUserLeft(data);
      },
    );

    this.realtimeClient.send(
      { cmd: MESSAGE_PATTERNS.BROADCAST_TYPING },
      (data: any) => {
        this.handleUserTyping(data);
      },
    );
  }

  @UseGuards(WsJwtGuard)
  async handleConnection(client: Socket) {
    try {
      const userId = client.data.user.sub;

      this.connectedClients.set(client.id, {
        userId,
        rooms: new Set<string>(),
      });

      await client.join(`user:${userId}`);

      this.logger.log(
        `Client connected: ${client.id} (User: ${userId}, Total: ${this.connectedClients.size})`,
      );

      client.emit('connected', {
        status: 'success',
        socketId: client.id,
        userId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Connection error for ${client.id}:`, error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const clientData = this.connectedClients.get(client.id);

    if (clientData) {
      // Notify realtime-service about disconnection
      this.realtimeClient.emit(MESSAGE_PATTERNS.PROCESS_LEAVE_ROOM, {
        userId: clientData.userId,
        rooms: Array.from(clientData.rooms),
        reason: 'disconnect',
      });

      this.connectedClients.delete(client.id);
      this.logger.log(
        `Client disconnected: ${client.id} (Remaining: ${this.connectedClients.size})`,
      );
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(REALTIME_EVENTS.SEND_MESSAGE)
  async handleMessage(
    @MessageBody(new WsValidationPipe()) data: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.data.user.sub;

      // Forward to realtime-service for processing
      const result = await firstValueFrom(
        this.realtimeClient.send<MessageResult>(
          MESSAGE_PATTERNS.PROCESS_MESSAGE,
          {
            ...data,
            senderId: userId,
            socketId: client.id,
          },
        ),
      );

      return {
        status: 'success',
        messageId: result.messageId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error processing message:`, error);
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
      const userId = client.data.user.sub;

      // Join socket.io room
      await client.join(`room:${data.roomId}`);

      // Track room membership
      const clientData = this.connectedClients.get(client.id);
      if (clientData) {
        clientData.rooms.add(data.roomId);
      }

      // Notify realtime-service
      await firstValueFrom(
        this.realtimeClient.send(MESSAGE_PATTERNS.PROCESS_JOIN_ROOM, {
          userId,
          roomId: data.roomId,
          socketId: client.id,
        }),
      );

      return {
        status: 'success',
        roomId: data.roomId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error joining room:`, error);
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
      const userId = client.data.user.sub;

      await client.leave(`room:${data.roomId}`);

      const clientData = this.connectedClients.get(client.id);
      if (clientData) {
        clientData.rooms.delete(data.roomId);
      }

      await firstValueFrom(
        this.realtimeClient.send(MESSAGE_PATTERNS.PROCESS_LEAVE_ROOM, {
          userId,
          roomId: data.roomId,
          socketId: client.id,
        }),
      );

      return {
        status: 'success',
        roomId: data.roomId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error leaving room:`, error);
      throw new WsException('Failed to leave room');
    }
  }

  // Handlers for events from realtime-service
  private handleBroadcastMessage(data: any) {
    if (data.roomId) {
      this.server
        .to(`room:${data.roomId}`)
        .emit(REALTIME_EVENTS.RECEIVE_MESSAGE, data);
    } else if (data.userId) {
      this.server
        .to(`user:${data.userId}`)
        .emit(REALTIME_EVENTS.RECEIVE_MESSAGE, data);
    } else {
      this.server.emit(REALTIME_EVENTS.RECEIVE_MESSAGE, data);
    }
  }

  private handleUserJoined(data: any) {
    this.server
      .to(`room:${data.roomId}`)
      .emit(REALTIME_EVENTS.USER_JOINED, data);
  }

  private handleUserLeft(data: any) {
    this.server.to(`room:${data.roomId}`).emit(REALTIME_EVENTS.USER_LEFT, data);
  }

  private handleUserTyping(data: any) {
    this.server
      .to(`room:${data.roomId}`)
      .emit(REALTIME_EVENTS.USER_TYPING, data);
  }

  // Utility method for external services
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Get connected clients count (for monitoring)
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }
}
