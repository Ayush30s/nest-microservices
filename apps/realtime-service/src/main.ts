import { NestFactory } from '@nestjs/core';
import { RealtimeServiceModule } from './realtime-service.module';
import { RedisIoAdapter } from './redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(RealtimeServiceModule);
  console.log('637cbrteyrucaturasjdgfkhjdhjfgasaer');

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();

  app.useWebSocketAdapter(redisIoAdapter);

  await app.listen(3004);
}
