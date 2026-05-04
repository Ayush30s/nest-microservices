import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreateGymDto,
  CreateShiftDto,
  CreateTrainerDto,
} from 'libs/common/DTO/gym.dto';
import { lastValueFrom } from 'rxjs';
@Injectable()
export class GymService {
  constructor(@Inject('GYM_SERVICE') private readonly gymClient: ClientProxy) {}

  async createGym(createGymDto: CreateGymDto) {
    return lastValueFrom(
      this.gymClient.send({ cmd: 'create-gym' }, createGymDto),
    );
  }

  async createShift(createShiftDto: CreateShiftDto) {
    return lastValueFrom(
      this.gymClient.send({ cmd: 'create-shift' }, createShiftDto),
    );
  }

  async addTrainer(id: number, gymId: number) {
    return lastValueFrom(
      this.gymClient.send(
        { cmd: 'add-trainer' },
        { trainerId: id, gymId: gymId },
      ),
    );
  }

  async removeTrainer(id: number, gymId: number) {
    return lastValueFrom(
      this.gymClient.send(
        { cmd: 'remove-trainer' },
        { trainerId: id, gymId: gymId },
      ),
    );
  }
}
