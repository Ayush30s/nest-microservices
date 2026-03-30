import { Module } from '@nestjs/common';
import { AuthServiceController } from './auth-service.controller';
import { AuthServiceService } from './auth-service.service';
import { PrismaModule } from 'libs/common/prismaConfig/primsa.module';
import { ConfigModule } from '@nestjs/config';
import { AwsModule } from 'libs/common/aws/aws.module';
import { JwtStrategy } from 'libs/common/auth/jwt.startegy';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/auth-service/.env',
    }),
    JwtModule.register({
      secret: 'my-secret-ket986r4r',
      signOptions: { expiresIn: '1h' },
    }),
    PrismaModule,
    AwsModule,
  ],
  controllers: [AuthServiceController],
  providers: [AuthServiceService, JwtStrategy],
})
export class AuthServiceModule {}
