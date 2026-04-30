import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { EmailServiceModule } from './email-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(EmailServiceModule, {
    transport: Transport.TCP,
    options: {
      host: 'localhost',
      port: 3006,
    },
  });

  await app.listen();
}
bootstrap();
