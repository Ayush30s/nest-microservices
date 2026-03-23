import { Get, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RoleDto } from 'libs/common/DTO/auth.dto';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}
  async createRole(roledto: RoleDto) {
    return lastValueFrom(this.authClient.send({ cmd: 'create-role' }, roledto));
  }
}
