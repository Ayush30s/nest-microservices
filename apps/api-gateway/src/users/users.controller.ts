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
import { RegisterDTO } from '../../../../libs/common/DTO/auth.dto';

@Controller('user')
export class UsersController {
  private readonly cbkey = 'user-service';
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly cbService: CircuitBreakerService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  registerUser(@Body() RegisterDTO: RegisterDTO) {
    return this.cbService.execute(this.cbkey, 'register-user', () =>
      this.userService.registerUser(RegisterDTO),
    );
  }
}
