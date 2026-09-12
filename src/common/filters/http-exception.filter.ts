import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiException,
  mapHttpStatusToErrorCode,
} from '../exceptions/api.exception.js';
import type { ApiErrorResponse } from '../response/interfaces/api-error-response.interface.js';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ApiErrorResponse = {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'code' in exceptionResponse &&
        'message' in exceptionResponse
      ) {
        body = exceptionResponse as ApiErrorResponse;
      } else if (typeof exceptionResponse === 'string') {
        body = {
          code: mapHttpStatusToErrorCode(status),
          message: exceptionResponse,
        };
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        const message = (exceptionResponse as { message: string | string[] })
          .message;
        body = {
          code: mapHttpStatusToErrorCode(status),
          message: Array.isArray(message) ? message.join(', ') : message,
        };
      }
    }

    if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
      this.logger.warn(
        `${request.method} ${request.url} → ${status} ${body.code}: ${body.message}`,
      );
    } else if (!(exception instanceof ApiException) && status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(body);
  }
}
