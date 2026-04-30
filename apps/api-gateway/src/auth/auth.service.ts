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

  signUser(payload: any) {
    return this.client.send({ cmd: 'sign-in' }, payload);
  }

  async registerUser(registerDto: RegisterDTO) {
    return await lastValueFrom(
      this.client.send({ cmd: 'register-user' }, registerDto),
    );
  }

  async refreshToken(token: string) {
    return await lastValueFrom(
      this.client.send({ cmd: 'refresh-token' }, token),
    );
  }

  async logout(token: string) {
    return await lastValueFrom(this.client.send({ cmd: 'logout' }, token));
  }
}
