// services/rate-limiter.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);
  private readonly limits = new Map<string, { count: number; resetAt: number }>();
  
  // Configure different limits per event type
  private readonly configs: Record<string, RateLimitConfig> = {
    send_message: { windowMs: 60000, maxRequests: 60 }, // 60 per minute
    ping: { windowMs: 30000, maxRequests: 30 }, // 30 per 30 seconds
  };

  async checkLimit(userId: string, event: string): Promise<void> {
    const config = this.configs[event];
    if (!config) return; // No limit for this event

    const key = `${userId}:${event}`;
    const now = Date.now();
    const limit = this.limits.get(key);

    // Reset if window has passed
    if (!limit || now > limit.resetAt) {
      this.limits.set(key, {
        count: 1,
        resetAt: now + config.windowMs,
      });
      return;
    }

    // Check if limit exceeded
    if (limit.count >= config.maxRequests) {
      const resetIn = Math.ceil((limit.resetAt - now) / 1000);
      this.logger.warn(`Rate limit exceeded for ${key}`);
      throw new WsException({
        message: 'Rate limit exceeded',
        retryAfter: resetIn,
      });
    }

    // Increment counter
    limit.count++;
  }
}