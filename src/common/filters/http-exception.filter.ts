import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiException,
  mapHttpStatusToErrorCode,
} from '../exceptions/api.exception.js';
import type { ApiErrorResponse } from '../response/interfaces/api-error-response.interface.js';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

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

    if (!(exception instanceof ApiException) && status >= 500) {
      console.error(exception);
    }

    response.status(status).json(body);
  }
}
