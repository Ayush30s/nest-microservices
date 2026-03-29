import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CircuitBreakerService } from '../common/circuitBreaker';
import { AwsModule } from 'libs/common/aws/aws.module';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 4004,
        },
      },
    ]),
    AwsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, CircuitBreakerService],
})
export class AuthModule {
  constructor() {}
}
