import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { ResilienceInterceptor } from './common/circuitBreakerInterceptor';
import { CircuitBreakerService } from './common/circuitBreaker';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
