import { NestFactory } from '@nestjs/core';
import { GymServiceModule } from './gym-service.module';
import { AppModule } from 'src/app.module';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    options: {
      transport: Transport.TCP,
      port: 3000,
    },
  });
  await app.listen();
}
bootstrap();
