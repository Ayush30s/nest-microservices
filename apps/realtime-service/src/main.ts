import { NestFactory } from '@nestjs/core';
import { RealtimeServiceModule } from './realtime-service.module';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(RealtimeServiceModule, {
    transport: Transport.TCP,
    options: {
      host: 'localhost',
      port: 3004,
    },
  });
  await app.listen();
}

bootstrap();
