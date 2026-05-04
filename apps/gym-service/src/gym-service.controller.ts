import { Controller, Get } from '@nestjs/common';
import { GymServiceService } from './gym-service.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateGymDto,
  CreateShiftDto,
  CreateTrainerDto,
} from 'libs/common/DTO/gym.dto';

@Controller()
export class GymServiceController {
  constructor(private readonly gymServiceService: GymServiceService) {}

  @MessagePattern({ cmd: 'create-gym' })
  async createGym(@Payload() createGymDto: CreateGymDto) {
    return await this.gymServiceService.createGym(createGymDto);
  }

  @MessagePattern({ cmd: 'create-shift' })
  createShift(@Payload() createShiftDto: CreateShiftDto) {
    return this.gymServiceService.createShift(createShiftDto);
  }

  @MessagePattern({ cmd: 'add-trainer' })
  addTrainer(@Payload() payload: number) {
    return this.gymServiceService.addTrainer(payload);
  }

  @MessagePattern({ cmd: 'remove-trainer' })
  removeTrainer(@Payload() payload: number) {
    return this.gymServiceService.removeTrainer(payload);
  }
}
