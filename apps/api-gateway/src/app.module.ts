import { Module } from '@nestjs/common';
import { CircuitBreakerService } from './common/circuitBreaker';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './product/product.module';
import { PrimsaModule } from 'libs/common/prismaService/primsa.module';

@Module({
  imports: [
    UsersModule,
    ProductsModule,
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
    Reflector,
    CircuitBreakerService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
