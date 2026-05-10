import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClientsModule.register([
      {
        name: 'AI_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 3007,
        },
      },
    ]),
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [],
})
export class AiModule {
  constructor() {}
}
