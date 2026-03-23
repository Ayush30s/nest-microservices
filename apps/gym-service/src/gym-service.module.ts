import { Module } from '@nestjs/common';
import { GymServiceController } from './gym-service.controller';
import { GymServiceService } from './gym-service.service';
import { PrimsaModule } from 'libs/common/prismaService/primsa.module';

@Module({
  imports: [PrimsaModule],
  controllers: [GymServiceController],
  providers: [GymServiceService],
})
export class GymServiceModule {}
