import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { UserServiceModule } from './user-service.module';
import { PrismaService } from './prismaService/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(UserServiceModule, {
    transport: Transport.TCP,
    options: {
      port: 4003,
    },
  });


  await app.listen();
}
bootstrap();
