import { Module } from '@nestjs/common';
import { UserServiceController } from './user-service.controller';
import { UserServiceService } from './user-service.service';
import { PrimsaModule } from 'libs/common/prismaService/primsa.module';

@Module({
  imports: [PrimsaModule],
  controllers: [UserServiceController],
  providers: [UserServiceService],
})
export class UserServiceModule {}
