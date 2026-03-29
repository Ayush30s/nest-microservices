import { Controller, Get, Logger } from '@nestjs/common';
import { AuthServiceService } from './auth-service.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RegisterDTO, RoleDto, SigninDto } from 'libs/common/DTO/auth.dto';

@Controller()
export class AuthServiceController {
  private readonly logger = new Logger(AuthServiceService.name);

  constructor(private readonly authServiceService: AuthServiceService) {}

  @MessagePattern({
    cmd: 'create-role',
  })
  createRole(@Payload() roleDto: RoleDto) {
    return this.authServiceService.createRole(roleDto);
  }

  @MessagePattern({
    cmd: 'sign-in',
  })
  async signIn(@Payload() signInDto: SigninDto) {
    return await this.authServiceService.signIn(signInDto);
  }

  @MessagePattern({
    cmd: 'register-user',
  })
  async registerUser(@Payload() registerDto: RegisterDTO) {
    return await this.authServiceService.registerUser(registerDto);
  }
}
