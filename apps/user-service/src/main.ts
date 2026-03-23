import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { UserServiceModule } from './user-service.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(UserServiceModule, {
    transport: Transport.TCP,
    options: {
      port: 4003,
    },
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  
  await app.listen();
}
bootstrap();
