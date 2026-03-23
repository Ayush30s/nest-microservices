import { Injectable, Logger } from '@nestjs/common';
import { RegisterDTO } from 'libs/common/DTO/auth.dto';

@Injectable()
export class UserServiceService {
  private readonly logger = new Logger(UserServiceService.name);

  getHello(): string {
    return 'Hello World!';
  }

  registerUser(RegisterDTO: RegisterDTO) {
    this.logger.debug(JSON.stringify(RegisterDTO));
    return RegisterDTO;
  }
}
