// apps/realtime-service/src/realtime-service.module.ts
import { Module } from '@nestjs/common';
import { RealtimeServiceController } from './realtime-service.controller';
import { RealtimeServiceService } from './realtime-service.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
    // Client to communicate back to API Gateway
    ClientsModule.registerAsync([
      {
        name: 'API_GATEWAY',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('API_GATEWAY_HOST', 'localhost'),
            port: configService.get('API_GATEWAY_PORT', 3005), // Different port for microservice communication
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [RealtimeServiceController],
  providers: [RealtimeServiceService],
})
export class RealtimeServiceModule {}
