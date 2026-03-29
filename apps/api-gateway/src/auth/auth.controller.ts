import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDTO, RoleDto, SigninDto } from 'libs/common/DTO/auth.dto';
import { CircuitBreakerService } from '../common/circuitBreaker';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { AwsService } from 'libs/common/aws/aws.service';

@Controller('auth')
export class AuthController {
  private readonly key = 'auth-service';
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly aws: AwsService,
    private readonly authService: AuthService,
    private readonly cbBreaker: CircuitBreakerService,
  ) {}

  @Post('create-role')
  async createRole(@Body() roleDto: RoleDto) {
    const breaker = this.cbBreaker.getBreaker(
      this.key,
      'create-role',
      async () => this.authService.createRole(roleDto),
    );

    return breaker.fire();
  }

  @Post('signin')
  async signUser(@Body() singInDto: SigninDto) {
    const breaker = this.cbBreaker.getBreaker(this.key, 'signin', async () =>
      this.authService.signUser(singInDto),
    );

    return breaker.fire();
  }
  @Post('register')
  @UseInterceptors(FileInterceptor('profileImageUrl'))
  async registerUser(
    @UploadedFile() file: Express.Multer.File,
    @Body() registerDto: RegisterDTO,
  ) {
    const awsS3res = file ? await this.aws.uploadFile(file) : null;
    const profileImageUrl = awsS3res?.url;
    const breaker = this.cbBreaker.getBreaker(this.key, 'register', async () =>
      this.authService.registerUser({
        ...registerDto,
        profileImageUrl,
      }),
    );

    return breaker.fire();
  }
}
