import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { UserServiceService } from './user-service.service';
import { RegisterDTO } from 'libs/common/DTO/user.dto';

@Controller()
export class UserServiceController {
  constructor(private readonly userService: UserServiceService) {}
  private readonly logger = new Logger(UserServiceController.name);

  @MessagePattern({ cmd: 'register_user' })
  registerUser(@Payload() ceateUserDto: RegisterDTO) {
    this.logger.warn('This is dto: ', ceateUserDto);
    return this.userService.registerUser(ceateUserDto);
  }
}
