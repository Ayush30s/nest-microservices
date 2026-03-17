import { Controller, Get } from '@nestjs/common';
import { UserService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UserService) {}

  @Get('getAllUsers')
  getAllUsers() {
    return this.usersService.getAllUsers();
  }
}