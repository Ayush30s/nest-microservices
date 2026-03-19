import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class GymService {
  constructor(
    @Inject('GYM_SERVICE') private readonly gymClient: ClientProxy,
  ) {}

  async getAllGyms() {
    return lastValueFrom(this.gymClient.send({ cmd: 'get_all_gym' }, {}));
  }
}
