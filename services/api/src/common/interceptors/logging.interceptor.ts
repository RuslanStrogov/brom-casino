import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const userAgent = request.get('user-agent') || 'unknown';
    const ip = request.ip || request.socket.remoteAddress || 'unknown';
    const userId = (request as any)?.userId || 'anonymous';

    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const elapsed = Date.now() - now;

          const logMessage = `${method} ${url} ${statusCode} ${elapsed}ms - ${ip} - ${userId} - ${userAgent}`;

          if (statusCode >= 400) {
            this.logger.warn(logMessage);
          } else {
            this.logger.log(logMessage);
          }
        },
        error: (error) => {
          const elapsed = Date.now() - now;
          this.logger.error(
            `${method} ${url} ERROR ${elapsed}ms - ${ip} - ${userId} - ${error.message}`,
            error.stack,
          );
        },
      }),
    );
  }
}
