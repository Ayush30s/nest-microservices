import { Controller, Get, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, throwError, timeout } from 'rxjs';
import { CircuitBreakerService } from '../common/circuitBreaker';
import { UserService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly cbService: CircuitBreakerService,
    private readonly userService: UserService,
  ) {}

  @Get()
  async getUsers() {
    const breaker = this.cbService.getBreaker(
      'user-service',
      'get-users',
      async () => this.userService.getAllUsers(),
    );

    return breaker.fire();
  }
}
