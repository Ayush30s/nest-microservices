// apps/api-gateway/realtime/gateway/redis-io.adapter.ts
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { Logger } from '@nestjs/common';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor!: ReturnType<typeof createAdapter>;
  private readonly logger = new Logger(RedisIoAdapter.name);

  async connectToRedis(): Promise<void> {
    try {
      const pubClient = createClient({ 
        url: process.env.REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            this.logger.warn(`Redis reconnection attempt ${retries}`);
            if (retries > 10) {
              this.logger.error('Max Redis reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });
      
      const subClient = pubClient.duplicate();

      pubClient.on('error', (err) => {
        this.logger.error('Redis Pub Client Error:', err);
      });

      subClient.on('error', (err) => {
        this.logger.error('Redis Sub Client Error:', err);
      });

      pubClient.on('connect', () => {
        this.logger.log('Redis Pub Client connected');
      });

      subClient.on('connect', () => {
        this.logger.log('Redis Sub Client connected');
      });

      await Promise.all([pubClient.connect(), subClient.connect()]);

      this.adapterConstructor = createAdapter(pubClient, subClient);
      this.logger.log('Redis adapter successfully created');
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        credentials: true,
        methods: ['GET', 'POST'],
      },
    });
    
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
      this.logger.log('Redis adapter attached to Socket.IO server');
    }
    
    return server;
  }
}

// ┌──────────────────────────────────────────────┐
// │ Layer 1: Browser / Mobile Client             │
// │ socket.emit("SEND_MESSAGE", payload)         │
// └──────────────────────────────────────────────┘
//                      |
//                      v
// ┌──────────────────────────────────────────────┐
// │ Layer 2: Nest WebSocket Gateway              │
// │ @SubscribeMessage(SEND_MESSAGE)              │
// │ handleMessage(...)                           │
// └──────────────────────────────────────────────┘
//                      |
//                      v
// ┌──────────────────────────────────────────────┐
// │ Layer 3: Nest Microservice Call              │
// │ realtimeClient.send(PROCESS_MESSAGE, data)   │
// └──────────────────────────────────────────────┘
//                      |
//                      v
// ┌──────────────────────────────────────────────┐
// │ Layer 4: Realtime Microservice Logic         │
// │ validate / save / decide recipients          │
// │ emits BROADCAST_MESSAGE                      │
// └──────────────────────────────────────────────┘
//                      |
//                      v
// ┌──────────────────────────────────────────────┐
// │ Layer 5: Gateway Broadcast Handler           │
// │ handleBroadcastMessage(data)                 │
// │ server.to(room).emit(RECEIVE_MESSAGE, data)  │
// └──────────────────────────────────────────────┘
//                      |
//                      v
// ┌──────────────────────────────────────────────┐
// │ Layer 6: Socket.IO Redis Adapter             │
// │ adapter intercepts emit                      │
// │ pubClient publishes via Redis                │
// │ subClient on other nodes receives            │
// └──────────────────────────────────────────────┘
//                      |
//                      v
// ┌──────────────────────────────────────────────┐
// │ Layer 7: Other Gateway Instances             │
// │ recreate same emit locally                   │
// │ deliver to local sockets in matching room    │
// └──────────────────────────────────────────────┘
//                      |
//                      v
// ┌──────────────────────────────────────────────┐
// │ Layer 8: Recipient Clients                   │
// │ receive RECEIVE_MESSAGE / USER_JOINED etc.   │
// └──────────────────────────────────────────────┘