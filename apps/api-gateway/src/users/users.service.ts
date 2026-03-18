import { Injectable } from '@nestjs/common';
@Injectable()
export class UserService {
  constructor(private readonly userClient: any) {}

  async getAllUsers() {
    return this.userClient.send({ cmd: 'get_all_users' }, {});
  }
}
