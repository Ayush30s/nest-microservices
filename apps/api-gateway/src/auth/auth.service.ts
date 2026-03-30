import { Inject, Injectable, Logger, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { JwtAuthGuard } from 'libs/common/auth/jwt-auth.guard';
import { RegisterDTO, RoleDto, SigninDto } from 'libs/common/DTO/auth.dto';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger();
  constructor(@Inject('AUTH_SERVICE') private client: ClientProxy) {}

  async createRole(roleDto: RoleDto) {
    return await lastValueFrom(
      this.client.send({ cmd: 'create-role' }, roleDto),
    );
  }

  async signUser(signInDto: SigninDto) {
    this.logger.debug(`singin service in api gateway ${signInDto}`);

    return await lastValueFrom(this.client.send({ cmd: 'sign-in' }, signInDto));
  }

  async registerUser(registerDto: RegisterDTO) {
    this.logger.debug(registerDto);
    return await lastValueFrom(
      this.client.send({ cmd: 'register-user' }, registerDto),
    );
  }
}
