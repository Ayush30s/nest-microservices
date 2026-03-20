import {
  Injectable,
  OnModuleInit,
  INestApplication,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from 'apps/user-service/generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    this.logger.log('user-service Database connected successfully');
    await this.$connect();
  }

  async onModuleDestroy() {
    this.logger.log('user-service Database disconnected successfully');
    await this.$disconnect();
  }

  async enableShutdownHooks(app: INestApplication) {
    this.logger.log('user-service app stopped successfully');
    this.$on('beforeExit', async () => {
      await app.close(); // graceful shutdown
    });
  }
}
