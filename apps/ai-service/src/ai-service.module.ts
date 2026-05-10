import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiServiceController } from './ai-service.controller';
import { AiServiceService } from './ai-service.service';
import { AiPostWorkoutService } from './ai-post-workout.service';
import { UserPrismaService } from 'apps/user-service/src/user-prisma.service';
import { FitnessRagService } from './ai-fitness-rag.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AiServiceController],
  providers: [
    AiServiceService,
    AiPostWorkoutService,
    AiPostWorkoutService,
    FitnessRagService,
  ],
})
export class AiServiceModule {
  private readonly logger = new Logger();
  constructor(private readonly configService: ConfigService) {
    this.logger.log(
      `DATABase URL : ${this.configService.get<string>('AI_DATABASE_URL')} `,
    );
  }
}
