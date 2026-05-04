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
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, throwError, timeout } from 'rxjs';
import { CircuitBreakerService } from '../common/circuitBreaker';
import { GymService } from './gym.service';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import {
  CreateGymDto,
  CreateShiftDto,
  CreateTrainerDto,
} from 'libs/common/DTO/gym.dto';
import { AwsService } from 'libs/common/aws/aws.service';

@Controller('gym')
export class GymController {
  private key = 'gym-service';
  private logger = new Logger(GymController.name);

  constructor(
    private readonly cbService: CircuitBreakerService,
    private readonly GymService: GymService,
    private readonly aws: AwsService,
    private readonly cbBreaker: CircuitBreakerService,
  ) {}

  @Post('create-gym')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'coverImage', maxCount: 1 },
    ]),
  )
  async createGym(
    @UploadedFiles()
    files: {
      image?: Express.Multer.File[];
      coverImage?: Express.Multer.File[];
    },
    @Body() createGymDto: CreateGymDto,
  ) {
    const imageUpload = files?.image?.[0]
      ? await this.aws.uploadFile(files.image[0])
      : null;

    const coverUpload = files?.coverImage?.[0]
      ? await this.aws.uploadFile(files.coverImage[0])
      : null;

    const breaker = this.cbBreaker.getBreaker(
      this.key,
      'create-gym',
      async () =>
        this.GymService.createGym({
          ...createGymDto,
          image: imageUpload?.url,
          coverImage: coverUpload?.url,
        }),
    );

    return breaker.fire();
  }

  @Post('create-shift')
  createShift(@Body() dto: CreateShiftDto) {
    const breaker = this.cbBreaker.getBreaker(
      this.key,
      'create-shift',
      async () => this.GymService.createShift(dto),
    );

    return breaker.fire();
  }

  @Post('add-trainer')
  addTrainer(@Param('id') id: number, @Req() req: Request) {
    const breaker = this.cbBreaker.getBreaker(
      this.key,
      'add-trainer',
      async () => this.GymService.addTrainer(id, req.user.id),
    );

    return breaker.fire();
  }
}
