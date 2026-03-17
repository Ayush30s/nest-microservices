import { NestFactory } from '@nestjs/core';
import { UserServiceModule } from './user-service.module';
import { AppModule } from 'src/app.module';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    options: {
      transport: Transport.TCP,
      port: 3002,
    },
  });
  await app.listen();
}
bootstrap();
