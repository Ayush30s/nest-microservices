import {
  Injectable,
  OnModuleInit,
  INestApplication,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client/extension';

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
}
