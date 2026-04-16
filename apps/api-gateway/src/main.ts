// apps/api-gateway/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { RpcToHttpExceptionFilter } from 'libs/RcpHttpExceptionFilter';
import { RedisIoAdapter } from './realtime/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS Configuration
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global Exception Filter
  app.useGlobalFilters(new RpcToHttpExceptionFilter());

  // WebSocket Redis Adapter for Horizontal Scaling
  if (process.env.REDIS_URL) {
    try {
      const redisIoAdapter = new RedisIoAdapter(app);
      await redisIoAdapter.connectToRedis();
      app.useWebSocketAdapter(redisIoAdapter);
      logger.log('✅ Redis IO Adapter initialized for WebSocket scaling');
    } catch (error: any) {
      logger.error('❌ Failed to initialize Redis IO Adapter:', error.message);
      logger.warn(
        '⚠️ Falling back to in-memory WebSocket adapter (single instance only)',
      );
    }
  } else {
    logger.warn('⚠️ REDIS_URL not set. WebSocket will not scale horizontally.');
  }

  // Global prefix for HTTP routes (keeps WebSocket paths clean)
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  const host = '0.0.0.0';

  await app.listen(port, host);

  logger.log(
    `🚀 API Gateway HTTP server running on http://${host}:${port}/api`,
  );
  logger.log(`🔌 WebSocket server available at ws://${host}:${port}/realtime`);
  logger.log(`📡 Health check endpoints:`);
  logger.log(`   - HTTP: http://${host}:${port}/api/health`);
  logger.log(
    `   - WebSocket: ws://${host}:${port}/realtime (connect and send 'ping')`,
  );
}

bootstrap();
