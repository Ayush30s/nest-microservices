import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ProfileDto } from 'libs/common/DTO/auth.dto';
import { lastValueFrom } from 'rxjs';
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
  ) {}

  async getAllUsers() {
    return lastValueFrom(this.userClient.send({ cmd: 'get_all_users' }, {}));
  }

  async upsertProfile(profileDto: ProfileDto) {
    return await lastValueFrom(
      this.userClient.send({ cmd: 'upsert-profile' }, profileDto),
    );
  }

  async getProfile(id: any) {
    return await lastValueFrom(
      this.userClient.send({ cmd: 'get-profile' }, id),
    );
  }
}
