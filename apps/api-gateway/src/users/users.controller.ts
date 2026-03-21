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
import { CreateUserDto } from './user.dto';

@Controller('user')
export class UsersController {
  private readonly cbkey = 'user-service';
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

  @Post('register')
  registerUser(@Body() createUserDto: CreateUserDto, @Req() req: Request) {
    const breaker = this.cbService.getBreaker(
      this.cbkey,
      'get-users',
      async () => this.userService.registerUser(createUserDto),
    );

    return breaker.fire();
  }
}
