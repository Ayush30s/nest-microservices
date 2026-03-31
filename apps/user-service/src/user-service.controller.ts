import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { ProfileDto } from 'libs/common/DTO/auth.dto';
import { UserServiceService } from './user-service.service';

@Controller()
export class UserServiceController {
  private readonly logger = new Logger(UserServiceController.name);

  constructor(private readonly userseviceService: UserServiceService) {}

  @MessagePattern({
    cmd: 'upsert-profile',
  })
  async upsertProfile(@Payload() profileDto: ProfileDto) {
    return await this.userseviceService.upsertProfile(profileDto);
  }

  @MessagePattern({
    cmd: 'get-profile',
  })
  async getProfile(@Payload() id: Number) {
    return await this.userseviceService.getProfile(id);
  }
}
