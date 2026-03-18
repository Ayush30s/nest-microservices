import { Injectable, Logger } from '@nestjs/common';
import CircuitBreaker from 'opossum';
import {
  delayWhen,
  Observable,
  OperatorFunction,
  retryWhen,
  scan,
  timer,
} from 'rxjs';

@Injectable()
export class CircuitBreakerService {
  constructor(private readonly logger: Logger) {}
  private breakers = new Map<string, any>();

  getBreaker(serviceName: string, action: any) {
    if (!this.breakers.has(serviceName)) {
      const breaker = this.createBreaker(action, serviceName);
      this.breakers.set(serviceName, breaker);
    }

    return this.breakers.get(serviceName);
  }

  createBreaker<T>(
    action: (...args: any[]) => Promise<T>,
    serviceName?: string,
  ) {
    const breaker = new CircuitBreaker(action, {
      timeout: 3000,
      errorThresholdPercentage: 50,
      resetTimeout: 10000,
    });

    breaker.on('open', () => {
      this.logger.error(`🔴 ${serviceName || 'Service'} Circuit OPEN`);
    });

    breaker.on('halfOpen', () => {
      this.logger.log(`🟡 ${serviceName || 'Service'} Circuit HALF-OPEN`);
    });

    breaker.on('close', () => {
      this.logger.log(`🟢 ${serviceName || 'Service'} Circuit CLOSED`);
    });

    breaker.on('failure', () => {
      this.logger.log(`❌ ${serviceName || 'Service'} Request failed`);
    });

    breaker.on('success', () => {
      this.logger.log(`✅ ${serviceName || 'Service'} Request success`);
    });

    return breaker;
  }

  retryStrategy<T>(): OperatorFunction<T, T> {
    return retryWhen((errors: Observable<any>) =>
      errors.pipe(
        scan((retryCount, err) => {
          if (retryCount >= 2) {
            throw err;
          }
          return retryCount + 1;
        }, 0),
        delayWhen((retryCount) => timer((retryCount + 1) * 500)),
      ),
    );
  }
}
