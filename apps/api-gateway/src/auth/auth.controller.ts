import { Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CircuitBreakerService } from '../common/circuitBreaker';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cbBrecker: CircuitBreakerService,
  ) {}
  @Post('role-create')
  async createRole() {
    const brecker = this.cbBrecker.getBreaker(
      'auth-service',
      'create-role',
      async () => this.createRole(),
    );

    return brecker.fire();
  }
}
