import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { UserServiceService } from './user-service.service';
import { CreateUserDto } from 'apps/api-gateway/src/users/user.dto';

@Controller()
export class UserServiceController {
  constructor(private readonly userService: UserServiceService) {}
  private readonly logger = new Logger(UserServiceController.name);

  @MessagePattern({ cmd: 'get_all_users' })
  getUsers() {
    return [
      { id: 1, name: 'John' },
      { id: 2, name: 'Alice' },
    ];
  }

  @MessagePattern({ cmd: 'register_user' })
  registerUser(@Payload() dto: CreateUserDto) {
    return this.userService.registerUser(dto);
  }
}
