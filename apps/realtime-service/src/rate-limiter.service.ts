import { Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);

  private readonly limits = new Map<
    string,
    { count: number; resetAt: number }
  >();

  private readonly configs: Record<string, RateLimitConfig> = {
    send_message: { windowMs: 60000, maxRequests: 60 },
    ping: { windowMs: 30000, maxRequests: 30 },
  };

  check(userId: string, event: string): void {
    const config = this.configs[event];
    if (!config) return; // no limit

    const key = `${userId}:${event}`;
    const now = Date.now();
    const limit = this.limits.get(key);

    if (!limit || now > limit.resetAt) {
      this.limits.set(key, {
        count: 1,
        resetAt: now + config.windowMs,
      });
      return;
    }

    if (limit.count >= config.maxRequests) {
      const resetIn = Math.ceil((limit.resetAt - now) / 1000);

      this.logger.warn(`Rate limit exceeded for ${key}`);

      throw new WsException({
        message: 'Rate limit exceeded',
        retryAfter: resetIn,
      });
    }

    limit.count++;
  }
}
