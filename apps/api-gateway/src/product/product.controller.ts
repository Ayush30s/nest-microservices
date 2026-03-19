import { Controller, Get, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, throwError, timeout } from 'rxjs';
import { CircuitBreakerService } from '../common/circuitBreaker';
import { ProductService } from './product.service';

@Controller('product')
export class ProductsController {
  constructor(
    private readonly cbService: CircuitBreakerService,
    private readonly productService: ProductService,
  ) {}

  @Get()
  async getUsers() {
    const breaker = this.cbService.getBreaker(
      'product-service',
      'get-products',
      async () => this.productService.getAllProducts(),
    );

    return breaker.fire();
  }
}
