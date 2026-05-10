import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
export class AiServiceModule {}
