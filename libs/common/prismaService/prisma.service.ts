// libs/prisma/src/prisma.service.ts
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client/extension';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly serviceName: string;

  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
    });

    this.serviceName =
      this.configService.get<string>('SERVICE_NAME') || 'unknown-service';
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log(`[${this.serviceName}] Database connected successfully`);
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log(`[${this.serviceName}] Database disconnected`);
  }
}
