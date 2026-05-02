import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RealtimeServiceService } from './realtime-service.service';
import { WsJwtGuard } from 'libs/common/auth/jwt-ws-guard';

import { RateLimiterService } from './rate-limiter.service';
import { RealtimeGateway } from './realtime.gateway';
import { JwtModule } from '@nestjs/jwt';
@Module({
  imports: [ConfigModule, JwtModule],
  providers: [
    RealtimeGateway,
    RealtimeServiceService,
    WsJwtGuard,
    RateLimiterService,
  ],
})
export class RealtimeServiceModule {}
