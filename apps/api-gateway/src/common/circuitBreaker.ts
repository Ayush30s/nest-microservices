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
  constructor() {}
  private readonly logger = new Logger(CircuitBreakerService.name);
  private breakers = new Map<string, any>();

  getBreaker(serviceName: string, endPoint: string, action?: any) {
    const key = `${serviceName}:${endPoint}`;

    if (!this.breakers.has(key)) {
      const breaker = this.createBreaker(action, key);
      this.breakers.set(key, breaker);
    }

    const breaker = this.breakers.get(key);

    if (action) {
      breaker.action = action;
    }

    return this.breakers.get(key);
  }

  createBreaker<T>(action: (...args: any[]) => Promise<T>, key?: string) {
    const breaker = new CircuitBreaker(action, {
      timeout: 3000,
      errorThresholdPercentage: 50,
      resetTimeout: 10000,
    });

    breaker.on('open', () => {
      this.logger.error(`🔴 ${key || 'Service'} Circuit OPEN`);
    });

    breaker.on('halfOpen', () => {
      this.logger.log(`🟡 ${key || 'Service'} Circuit HALF-OPEN`);
    });

    breaker.on('close', () => {
      this.logger.log(`🟢 ${key || 'Service'} Circuit CLOSED`);
    });

    breaker.on('failure', () => {
      this.logger.log(`❌ ${key || 'Service'} Request failed`);
    });

    breaker.on('success', () => {
      this.logger.log(`✅ ${key || 'Service'} Request success`);
    });

    return breaker;
  }

  async execute<T>(
    serviceName: string,
    endPointcmd: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const key = `${serviceName}:${endPointcmd}`;

    const breaker = this.getBreaker(serviceName, endPointcmd, async () => {
      try {
        return await fn();
      } catch (err: any) {
        this.logger.error(`❌ Error in ${key}: ${err?.message}`, err?.stack);
        throw err;
      }
    });

    return breaker.fire();
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
