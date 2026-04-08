import { Module } from '@nestjs/common';
import { GymServiceController } from './product-service.controller';
import { GymServiceService } from './product-service.service';

@Module({
  imports: [],
  controllers: [GymServiceController],
  providers: [GymServiceService],
})
export class GymServiceModule {}
