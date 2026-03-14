
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class UsersService {
  constructor(
    @Inject('USER_SERVICE') private userClient: ClientProxy,
  ) {}

  getAllUsers() {
    return this.userClient.send(
      { cmd: 'get_all_users' },
      {},
    );
  }
}