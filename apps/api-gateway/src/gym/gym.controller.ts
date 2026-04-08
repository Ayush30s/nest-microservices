import { Controller, Get, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, throwError, timeout } from 'rxjs';
import { CircuitBreakerService } from '../common/circuitBreaker';
import { GymService } from './gym.service';

@Controller('gym')
export class GymController {
  private cbKey = 'gym-service';

  constructor(
    private readonly cbService: CircuitBreakerService,
    private readonly GymService: GymService,
  ) {}

  @Get()
  async getUsers() {
    const breaker = this.cbService.getBreaker(
      this.cbKey,
      'create-gyms',
      async () => this.GymService.createGym(),
    );

    return breaker.fire();
  }
}
