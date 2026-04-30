import { Logger, Module } from '@nestjs/common';
import { AuthServiceController } from './auth-service.controller';
import { AuthServiceService } from './auth-service.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AwsModule } from 'libs/common/aws/aws.module';
import { JwtStrategy } from 'libs/common/auth/jwt.startegy';
import { JwtModule } from '@nestjs/jwt';
import { AuthPrismaService } from './auth-prisma.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
      {
        name: 'EMAIL_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 3006,
        },
      },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '1h',
        },
      }),
    }),
    AwsModule,
  ],
  controllers: [AuthServiceController],
  providers: [AuthServiceService, JwtStrategy, AuthPrismaService],
})
export class AuthServiceModule {
  private logger = new Logger(AuthServiceModule.name);
  constructor(private readonly config: ConfigService) {
    this.logger.verbose(`
      -------------------------
      Auth - Service env loaded : 
      -----------------------------------------------------------
      ${config.get<string>('AUTH_DATABASE_URL')}
      -----------------------------------------------------------
      `);
  }
}
