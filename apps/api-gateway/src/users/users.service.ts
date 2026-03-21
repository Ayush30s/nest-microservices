import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { CreateUserDto } from './user.dto';
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
  ) {}

  async getAllUsers() {
    this.logger.log('this is register');
    return lastValueFrom(this.userClient.send({ cmd: 'get_all_users' }, {}));
  }

  async registerUser(createUserDto: CreateUserDto) {
    return lastValueFrom(this.userClient.send({ cmd: 'register_user' }, {}));
  }
}
