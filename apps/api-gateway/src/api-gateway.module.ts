import { Module } from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CircuitBreakerService } from './common/circuitBreaker';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ResilienceInterceptor } from './common/circuitBreakerInterceptor';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3001 },
      },
      {
        name: 'PRODUCT_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3002 },
      },
      {
        name: 'GYM_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3003 },
      },
    ]),
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
