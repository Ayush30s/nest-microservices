import { Module } from '@nestjs/common';
import { ClientProxy, ClientsModule, Transport } from '@nestjs/microservices';
import { CircuitBreakerService } from '../common/circuitBreaker';
import { GymController } from './gym.controller';
import { GymService } from './gym.service';
import { ConfigModule } from '@nestjs/config';
import { AwsModule } from 'libs/common/aws/aws.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ClientsModule.register([
      {
        name: 'GYM_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3003 },
      },
    ]),

    AwsModule,
  ],
  controllers: [GymController],
  providers: [GymService, CircuitBreakerService],
})
export class GymModule {}
