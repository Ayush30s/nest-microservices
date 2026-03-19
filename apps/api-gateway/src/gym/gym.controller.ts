import { Controller, Get, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, throwError, timeout } from 'rxjs';
import { CircuitBreakerService } from '../common/circuitBreaker';
import { GymService } from './gym.service';

@Controller('gym')
export class GymController {
  constructor(
    private readonly cbService: CircuitBreakerService,
    private readonly gymService: GymService,
  ) {}

  @Get()
  async getUsers() {
    const breaker = this.cbService.getBreaker(
      'gym-service',
      'get-gym',
      async () => this.gymService.getAllGyms(),
    );

    return breaker.fire();
  }
}
