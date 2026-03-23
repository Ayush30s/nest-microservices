import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { RegisterDTO } from '../../../../libs/common/DTO/auth.dto';
@Injectable()
export class UserService {
  constructor(
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
  ) {}

  async registerUser(RegisterDTO: RegisterDTO) {
    return lastValueFrom(
      this.userClient.send({ cmd: 'register_user' }, RegisterDTO),
    );
  }
}
