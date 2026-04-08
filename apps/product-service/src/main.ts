import { NestFactory } from '@nestjs/core';
import { GymServiceModule } from './product-service.module';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(GymServiceModule, {
    transport: Transport.TCP,
    options: {
      port: 4002,
    },
  });
  await app.listen();
}
bootstrap();
