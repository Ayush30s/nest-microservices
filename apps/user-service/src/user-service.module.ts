import { Logger, Module } from '@nestjs/common';
import { UserServiceController } from './user-service.controller';
import { UserServiceService } from './user-service.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AwsModule } from 'libs/common/aws/aws.module';
import { UserPrismaService } from './user-prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/user-service/.env',
    }),
    AwsModule,
  ],
  controllers: [UserServiceController],
  providers: [UserServiceService, UserPrismaService],
})
export class UserServiceModule {
  private logger = new Logger(UserServiceModule.name);
  constructor(private readonly config: ConfigService) {
    this.logger.verbose(`
      -------------------------
      User - Service env loaded : 
      -----------------------------------------------------------
      ${config.get<string>('DATABASE_URL')}
      -----------------------------------------------------------
      `);
  }
}
