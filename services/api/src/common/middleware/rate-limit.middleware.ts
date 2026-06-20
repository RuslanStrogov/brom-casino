import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS, AUTH_RATE_LIMIT_MAX } from '@brom-casino/shared';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly requests: Map<string, RateLimitEntry> = new Map();
  private readonly authRequests: Map<string, RateLimitEntry> = new Map();

  // Paths that should use stricter auth rate limits
  private readonly authPaths = ['/api/auth/login', '/api/auth/register', '/api/auth/telegram'];

  use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const path = req.path || req.url;
    const now = Date.now();

    // Use stricter limits for auth endpoints
    const isAuthPath = this.authPaths.some((authPath) => path.startsWith(authPath));
    const store = isAuthPath ? this.authRequests : this.requests;
    const maxRequests = isAuthPath ? AUTH_RATE_LIMIT_MAX : RATE_LIMIT_MAX_REQUESTS;

    let entry = store.get(ip);

    if (!entry || now > entry.resetAt) {
      entry = {
        count: 1,
        resetAt: now + RATE_LIMIT_WINDOW_MS,
      };
      store.set(ip, entry);
    } else {
      entry.count++;
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count));
    res.setHeader('X-RateLimit-Reset', new Date(entry.resetAt).toISOString());

    if (entry.count > maxRequests) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
      throw new HttpException(
        {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          details: {
            retryAfter: Math.ceil((entry.resetAt - now) / 1000),
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    next();
  }
}
