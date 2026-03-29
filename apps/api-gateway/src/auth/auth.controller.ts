import { Body, Controller, Logger, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RoleDto } from 'libs/common/DTO/auth.dto';
import { CircuitBreakerService } from '../common/circuitBreaker';

@Controller('auth')
export class AuthController {
  private readonly key = 'auth-service';
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly cbBreaker: CircuitBreakerService,
  ) {}

  @Post('create-role')
  async createRole(@Body() roleDto: RoleDto) {
    const breaker = this.cbBreaker.getBreaker(
      this.key,
      'create-role',
      async () => await this.authService.createRole(roleDto),
    );

    breaker.fire();
  }
}
