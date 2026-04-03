import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class AwsService {
  private readonly logger = new Logger(AwsService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly region: string; // ✅ ADD THIS

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.getOrThrow<string>('AWS_BUCKET_NAME');
    this.region = this.configService.getOrThrow<string>('AWS_REGION'); // ✅ STORE IT

    this.s3 = new S3Client({
      region: this.region,
    });
  }

  async uploadFile(file: Express.Multer.File) {
    const isImage = file?.mimetype?.startsWith('image/');
    const folder = isImage ? 'images' : 'videos';

    const key = `${folder}/${uuidv4()}-${file.originalname}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      }),
    );

    const url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`; // ✅ FIXED

    return {
      bucket: this.bucket,
      key,
      url,
      type: isImage ? 'image' : 'video',
    };
  }

  async deleteFile(fileKey: string) {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: fileKey,
        }),
      );
    } catch (error) {
      this.logger.error('File deletion failed', error);
    }
  }
}
