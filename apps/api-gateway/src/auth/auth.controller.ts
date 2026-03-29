import { Body, Controller, Get, Logger, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDTO, RoleDto, SigninDto } from 'libs/common/DTO/auth.dto';
import { CircuitBreakerService } from '../common/circuitBreaker';
import type { Request } from 'express';

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
      async () => this.authService.createRole(roleDto),
    );

    return breaker.fire();
  }

  @Post('signin')
  async signUser(@Body() singInDto: SigninDto) {
    const breaker = this.cbBreaker.getBreaker(
      this.key,
      'signin',
      async () => this.authService.signUser(singInDto),
    );

    return breaker.fire();
  }

  @Post('register')
  async registerUser(@Body() registerDto: RegisterDTO) {
    const breaker = this.cbBreaker.getBreaker(
      this.key,
      'register',
      async () => this.authService.registerUser(registerDto),
    );

    return breaker.fire();
  }
}
