import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RealtimeServiceService } from './realtime-service.service';
import { WsJwtGuard } from 'libs/common/auth/jwt-ws-guard';

import { RealtimeGateway } from './realtime.gateway';
import { RateLimiterService } from './rate-limiter.service';
@Module({
  imports: [ConfigModule],
  providers: [
    RealtimeGateway,
    RealtimeServiceService,
    WsJwtGuard,
    RateLimiterService,
  ],
})
export class RealtimeServiceModule {}
