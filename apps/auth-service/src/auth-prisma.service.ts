import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma-clients/auth';

@Injectable()
export class AuthPrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(AuthPrismaService.name);
  private readonly serviceName: string;

  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
    });

    this.serviceName = this.configService.get<string>('SERVICE_NAME')!;
    this.logger.log('prsima init for : ', this.serviceName);
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
