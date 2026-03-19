import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CircuitBreakerService } from '../common/circuitBreaker';
import { GymController } from './gym.controller';
import { GymService } from './gym.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'GYM_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 4002 },
      },
    ]),
  ],
  controllers: [GymController],
  providers: [GymService, CircuitBreakerService],
})
export class ProductsModule {}
