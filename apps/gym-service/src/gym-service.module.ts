import { Logger, Module } from '@nestjs/common';
import { GymServiceController } from './gym-service.controller';
import { GymServiceService } from './gym-service.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GymPrismaService } from './gym-prisma.service';
import { AwsModule } from 'libs/common/aws/aws.module';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/gym-service/.env',
    }),
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 3001,
        },
      },
    ]),
    AwsModule,
  ],
  controllers: [GymServiceController],
  providers: [GymServiceService, GymPrismaService],
})
export class GymServiceModule {
  private logger = new Logger(GymServiceModule.name);

  constructor(private readonly config: ConfigService) {
    this.logger.verbose(`
      Gym - Service env loaded : 
      ${config.get<string>('DATABASE_URL')}
    `);
  }
}
