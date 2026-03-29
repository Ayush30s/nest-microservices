import { Injectable, Logger } from '@nestjs/common';
import { RoleDto } from 'libs/common/DTO/auth.dto';
import { PrismaService } from 'libs/common/prismaConfig/prisma.service';

@Injectable()
export class AuthServiceService {
  private readonly logger = new Logger(AuthServiceService.name);

  constructor(private readonly prism: PrismaService) {}

  async createRole(roleDto: RoleDto) {
    const data = await this.prism.role.create({
      data: {
        name: roleDto.name,
      },
    });

    this.logger.debug(`role created: ${JSON.stringify(data)}`);
    return 'Hello World!';
  }
}
