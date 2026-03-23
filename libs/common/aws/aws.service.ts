import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';

@Injectable()
export class AwsService {
  private readonly logger = new Logger(AwsService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.getOrThrow<string>('AWS_BUCKET_NAME');

    this.s3 = new S3Client({
      region: this.configService.getOrThrow<string>('AWS_REGION'),
    });
  }

  async uploadFile(file: Express.Multer.File) {
    const isImage = file?.mimetype?.startsWith('image/');
    const folder = isImage ? 'images' : 'videos';

    const key = `${folder}/${uuid()}-${file.originalname}`;
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return {
      bucket: this.bucket,
      key,
      type: isImage ? 'image' : 'video',
    };
  }

  async deleteFile(FileKey: string) {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: FileKey,
        }),
      );
    } catch (error) {
      this.logger.error('File deletion failed');
    }
  }
}
