import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AwsService } from './aws.service';

@Controller('aws')
export class AwsController {
  constructor(private readonly awsService: AwsService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 50 * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
        const IsImage = file.mimetype.startsWith('image/');
        const IsVideo = file.mimetype.startsWith('video/');

        if (!IsImage && !IsVideo) {
          return cb(
            new BadRequestException('Only image and video files are allowed'),
            false,
          );
        }

        cb(null, true);
      },
    }),
  )
  handleUploadMedia(@UploadedFile() file: Express.Multer.File) {
    return this.awsService.uploadFile(file);
  }
}
