import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CircuitBreakerService } from '../common/circuitBreaker';
import { AwsModule } from 'libs/common/aws/aws.module';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from 'libs/common/auth/jwt.startegy';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 3002,
        },
      },
    ]),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.register({
      secret: 'my-secret-ket986r4r',
      signOptions: { expiresIn: '1h' },
    }),

    AwsModule,
  ],

  controllers: [AuthController],

  providers: [AuthService, CircuitBreakerService, JwtStrategy],
})
export class AuthModule {}
