import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CircuitBreakerService } from '../common/circuitBreaker';
import { ProductsController } from './product.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PRODUCT_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 4002 },
      },
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductService, CircuitBreakerService],
})
export class ProductsModule {}
