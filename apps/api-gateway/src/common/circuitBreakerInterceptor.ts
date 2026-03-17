import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, lastValueFrom, from } from 'rxjs';
import { CircuitBreakerService } from '../common/circuitBreaker';
import { Reflector } from '@nestjs/core';

@Injectable()
export class ResilienceInterceptor implements NestInterceptor {
  constructor(
    private readonly cbService: CircuitBreakerService,
    private readonly reflector: Reflector,
  ) {}

  async handleCall(next: CallHandler) {
    return lastValueFrom(next.handle().pipe(this.cbService.retryStrategy()));
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const serviceName =
      this.reflector.get<string>('service', context.getHandler()) ||
      'DEFAULT_SERVICE';

    const breaker = this.cbService.getBreaker(
      serviceName,
      this.handleCall.bind(this),
    );

    return from(breaker.fire(next));
  }
}
