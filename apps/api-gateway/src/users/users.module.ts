import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserService } from './users.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CircuitBreakerService } from '../common/circuitBreaker';
import { AwsModule } from 'libs/common/aws/aws.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 4003,
        },
      },
    ]),

    AwsModule,
  ],
  controllers: [UsersController],
  providers: [UserService, CircuitBreakerService],
})
export class UsersModule {}
