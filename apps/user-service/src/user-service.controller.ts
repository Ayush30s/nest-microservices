import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern } from '@nestjs/microservices';

@Controller()
export class UserServiceController {
  private readonly logger = new Logger(UserServiceController.name);

  @MessagePattern({ cmd: 'get_all_users' })
  getUsers() {
    return [
      { id: 1, name: 'John' },
      { id: 2, name: 'Alice' },
    ];
  }

  @EventPattern('user_created')
  handleUserCreated(data: any) {
    console.log(`user created successfully ${data}`);
  }
}
