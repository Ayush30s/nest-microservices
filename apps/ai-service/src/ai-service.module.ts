import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiServiceController } from './ai-service.controller';
import { AiServiceService } from './ai-service.service';
import { AiConfigService } from './ai-config.service';
import { UserPrismaService } from 'apps/user-service/src/user-prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [AiServiceController],
  providers: [AiServiceService, AiConfigService],
})
export class AiServiceModule {}
