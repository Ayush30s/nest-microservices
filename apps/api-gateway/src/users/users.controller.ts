import {
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CircuitBreakerService } from '../common/circuitBreaker';
import { UserService } from './users.service';
import { JwtAuthGuard } from 'libs/common/auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfileDto } from 'libs/common/DTO/auth.dto';
import { AwsService } from 'libs/common/aws/aws.service';

@Controller('user')
export class UsersController {
  private readonly key = 'user-service';
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly aws: AwsService,
    private readonly cbBreaker: CircuitBreakerService,
    private readonly userService: UserService,
  ) {}

  @Get()
  async getUsers() {
    this.logger.log('this is register');

    const breaker = this.cbBreaker.getBreaker(
      'user-service',
      'get-users',
      async () => this.userService.getAllUsers(),
    );

    return breaker.fire();
  }

  @UseGuards(JwtAuthGuard)
  @Post('upsert-profile/:id')
  @UseInterceptors(FileInterceptor('profileImageUrl'))
  async upsertProfile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() profileDto: ProfileDto,
  ) {
    const awsS3res = file ? await this.aws.uploadFile(file) : null;
    const profileImageUrl = awsS3res?.url;
    const breaker = this.cbBreaker.getBreaker(
      this.key,
      'create-profile',
      async () =>
        this.userService.upsertProfile({
          ...profileDto,
          id,
          profileImageUrl,
        }),
    );

    return breaker.fire();
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile/:id')
  async getProfile(@Param('id') id: string) {
    const breaker = this.cbBreaker.getBreaker(
      this.key,
      'create-profile',
      async () => this.userService.getProfile(id),
    );

    return breaker.fire();
  }
}
