import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiError } from '@brom-casino/shared';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let error: ApiError;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        error = {
          code: this.getErrorCode(status),
          message: exceptionResponse,
        };
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        error = {
          code: this.getErrorCode(status),
          message: responseObj.message || exception.message,
          details: responseObj.details || responseObj.errors,
        };
      } else {
        error = {
          code: this.getErrorCode(status),
          message: exception.message,
        };
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      error = {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      };

      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      error = {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
      };

      this.logger.error('Unknown exception type', JSON.stringify(exception));
    }

    // Log the error
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status}: ${error.message}`,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${status}: ${error.message}`,
      );
    }

    response.status(status).json({
      success: false,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private getErrorCode(status: number): string {
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      405: 'METHOD_NOT_ALLOWED',
      408: 'REQUEST_TIMEOUT',
      409: 'CONFLICT',
      413: 'PAYLOAD_TOO_LARGE',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
    };
    return codes[status] || 'UNKNOWN_ERROR';
  }
}
