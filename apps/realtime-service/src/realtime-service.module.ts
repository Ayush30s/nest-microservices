// apps/realtime-service/src/realtime-service.module.ts
import { Controller, Module } from '@nestjs/common';
import { RealtimeServiceController } from './realtime-service.controller';
import { RealtimeServiceService } from './realtime-service.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [RealtimeServiceController],
  providers: [RealtimeServiceService],
})
export class RealtimeServiceModule {}
