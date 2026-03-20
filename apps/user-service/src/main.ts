import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { UserServiceModule } from './user-service.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(UserServiceModule, {
    transport: Transport.TCP,
    options: {
      port: 4003,
    },
  });

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);
  await app.listen();
}
bootstrap();
