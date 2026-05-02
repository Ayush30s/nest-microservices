import { NestFactory } from '@nestjs/core';
import { AiServiceModule } from './ai-service.module';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AiServiceModule, {
    transport: Transport.TCP,
    options: {
      host: 'localhost',
      port: 3007,
    },
  });

  await app.listen();
}

bootstrap();
