import { Controller, Get, Logger } from '@nestjs/common';
import { AuthServiceService } from './auth-service.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RoleDto } from 'libs/common/DTO/auth.dto';

@Controller()
export class AuthServiceController {
  private readonly logger = new Logger(AuthServiceService.name);

  constructor(private readonly authServiceService: AuthServiceService) {}

  @MessagePattern({
    cmd: 'create-role',
  })
  createRole(@Payload() roleDto: RoleDto) {
    this.logger.debug(`roleDto: ${JSON.stringify(roleDto)}`);
    return this.authServiceService.createRole(roleDto);
  }
}
