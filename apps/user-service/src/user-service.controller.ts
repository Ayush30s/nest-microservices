import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern } from '@nestjs/microservices';

@Controller()
export class UserServiceController {
  @MessagePattern({ cmd: 'get_users' })
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
