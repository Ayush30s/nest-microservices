// apps/api-gateway/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { RpcToHttpExceptionFilter } from 'libs/RcpHttpExceptionFilter';
import { RedisIoAdapter } from '../../realtime-service/src/redis-io.adapter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(','),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.useGlobalFilters(new RpcToHttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('My Microservice API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document, {
    useGlobalPrefix: true,
  });

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
