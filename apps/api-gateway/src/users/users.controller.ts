import {
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { CircuitBreakerService } from '../common/circuitBreaker';
import { UserService } from './users.service';

@Controller('user')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly cbService: CircuitBreakerService,
    private readonly userService: UserService,
  ) {}

  @Get()
  async getUsers() {
    this.logger.log('this is register');

    const breaker = this.cbService.getBreaker(
      'user-service',
      'get-users',
      async () => this.userService.getAllUsers(),
    );

    return breaker.fire();
  }
}
