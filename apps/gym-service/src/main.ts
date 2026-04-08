import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { GymServiceModule } from './gym-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(GymServiceModule, {
    transport: Transport.TCP,
    options: {
      host: 'localhost',
      port: 3003,
    },
  });
  await app.listen();
}

bootstrap();
