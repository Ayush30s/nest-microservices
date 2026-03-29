import { Module } from '@nestjs/common';
import { AuthServiceController } from './auth-service.controller';
import { AuthServiceService } from './auth-service.service';
import { PrismaModule } from 'libs/common/prismaConfig/primsa.module';
import { ConfigModule } from '@nestjs/config';
import { AwsModule } from 'libs/common/aws/aws.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/auth-service/.env',
    }),
    PrismaModule,
    AwsModule,
  ],
  controllers: [AuthServiceController],
  providers: [AuthServiceService],
})
export class AuthServiceModule {}
