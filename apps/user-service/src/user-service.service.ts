import { Injectable } from '@nestjs/common';
import { CreateUserDto } from 'apps/api-gateway/src/users/user.dto';

@Injectable()
export class UserServiceService {
  getHello(): string {
    return 'Hello World!';
  }

  registerUser(createUserDto: CreateUserDto) {
    return createUserDto;
  }
}
