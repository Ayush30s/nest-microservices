import { Controller, Get } from '@nestjs/common';
import { UserService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UserService) {}

  @Get()
  getUsers() {
    return this.userClient.send({ cmd: 'get_users' }, {}).pipe(
      timeout(5000),
      catchError((err) => {
        return throwError(() => new Error('User service unavailable',err));
      }),
    );
  }

  @Post()
  createUser() {
    this.userClient.emit('user_created', { id: 1, email: 'test@mail.com' });
  }
}
