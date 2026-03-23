import { JwtStrategy } from 'apps/api-gateway/src/auth/jwt.startegy';
import { AuthService } from './auth-service.service';
import { AuthController } from './auth-service.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { AwsModule } from 'libs/common/aws/aws.module';
import { JwtModule } from '@nestjs/jwt';
import { PrimsaModule } from 'libs/common/prismaService/primsa.module';

@Module({
  imports: [
    AwsModule,
    ConfigModule,
    PrimsaModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [],
})
export class AuthModule {}
