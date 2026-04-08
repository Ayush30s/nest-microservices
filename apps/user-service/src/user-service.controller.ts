import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { UserServiceService } from './user-service.service';
import { ProfileDto } from 'libs/common/DTO/user.dto';

@Controller()
export class UserServiceController {
  private readonly logger = new Logger(UserServiceController.name);

  constructor(private readonly userseviceService: UserServiceService) {}

  @EventPattern('user-registered')
  async handleUserRegistered(
    @Payload() data: { authId: number; email: string; name: string },
  ) {
    this.logger.log(`Received registration event for authId: ${data.authId}`);

    await this.userseviceService.upsertProfile({
      id: data.authId.toString(),
      email: data.email,
      name: data.email,
    });

    this.logger.log(`User and Profile created for authId: ${data.authId}`);
  }

  @MessagePattern({
    cmd: 'upsert-profile',
  })
  async upsertProfile(@Payload() profileDto: ProfileDto) {
    return await this.userseviceService.upsertProfile(profileDto);
  }

  @MessagePattern({
    cmd: 'get-profile',
  })
  async getProfile(@Payload() id: number) {
    return await this.userseviceService.getProfile(id);
  }
}
