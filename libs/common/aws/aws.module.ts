import { Module } from '@nestjs/common';
import { AwsController } from './aws.controller';
import { AwsService } from './aws.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [AwsController],
  providers: [AwsService],
  exports: [AwsService],
})
export class AwsModule {
  constructor(private readonly configService: ConfigService) {
    console.log('aws module init...');
    const env = this.configService.get<string>('AWS_BUCKET_NAME');
    console.log(env);
  }
}
