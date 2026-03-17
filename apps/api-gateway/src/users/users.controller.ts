import { Controller, Get, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, throwError, timeout } from 'rxjs';

@Controller('users')
export class UsersController {
  constructor(@Inject('USER_SERVICE') private userClient: ClientProxy) {}

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
