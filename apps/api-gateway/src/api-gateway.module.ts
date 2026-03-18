import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CircuitBreakerService } from './common/circuitBreaker';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ResilienceInterceptor } from './common/circuitBreakerInterceptor';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3002 },
      },
      {
        name: 'PRODUCT_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3001 },
      },
      {
        name: 'GYM_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3000 },
      },
    ]),

    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60,
          limit: 20,
        },
      ],
    }),
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  controllers: [ApiGatewayController],
  providers: [
    ApiGatewayService,
    CircuitBreakerService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResilienceInterceptor,
    },
  ],
})
export class ApiGatewayModule {}
