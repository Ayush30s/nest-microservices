import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(@Inject('AUTH_SERVICE') private client: ClientProxy) {}

  async createRole(data: any) {
    return await lastValueFrom(this.client.send({ cmd: 'create-role' }, data));
  }
}
