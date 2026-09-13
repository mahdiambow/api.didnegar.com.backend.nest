import { HttpException, HttpStatus } from '@nestjs/common';
import type { ApiFieldError } from '../response/interfaces/api-field-error.interface.js';

export class ApiException extends HttpException {
  constructor(
    code: string,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    errors?: ApiFieldError[],
  ) {
    super({ code, message, errors }, status);
  }
}

const STATUS_MAP: Record<number, string> = {
  // 2xx
  [HttpStatus.OK]: 'OK',
  [HttpStatus.CREATED]: 'CREATED',
  [HttpStatus.ACCEPTED]: 'ACCEPTED',
  [HttpStatus.NO_CONTENT]: 'NO_CONTENT',

  // 3xx
  [HttpStatus.MOVED_PERMANENTLY]: 'MOVED_PERMANENTLY',
  [HttpStatus.FOUND]: 'FOUND',
  [HttpStatus.NOT_MODIFIED]: 'NOT_MODIFIED',
  [HttpStatus.TEMPORARY_REDIRECT]: 'TEMPORARY_REDIRECT',
  [HttpStatus.PERMANENT_REDIRECT]: 'PERMANENT_REDIRECT',

  // 4xx
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.PAYMENT_REQUIRED]: 'PAYMENT_REQUIRED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.METHOD_NOT_ALLOWED]: 'METHOD_NOT_ALLOWED',
  [HttpStatus.NOT_ACCEPTABLE]: 'NOT_ACCEPTABLE',
  [HttpStatus.PROXY_AUTHENTICATION_REQUIRED]: 'PROXY_AUTHENTICATION_REQUIRED',
  [HttpStatus.REQUEST_TIMEOUT]: 'REQUEST_TIMEOUT',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.GONE]: 'GONE',
  [HttpStatus.LENGTH_REQUIRED]: 'LENGTH_REQUIRED',
  [HttpStatus.PRECONDITION_FAILED]: 'PRECONDITION_FAILED',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'PAYLOAD_TOO_LARGE',
  [HttpStatus.URI_TOO_LONG]: 'URI_TOO_LONG',
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: 'UNSUPPORTED_MEDIA_TYPE',
  [HttpStatus.EXPECTATION_FAILED]: 'EXPECTATION_FAILED',
  [HttpStatus.I_AM_A_TEAPOT]: 'I_AM_A_TEAPOT',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
  [HttpStatus.LOCKED]: 'LOCKED',
  [HttpStatus.FAILED_DEPENDENCY]: 'FAILED_DEPENDENCY',
  [HttpStatus.PRECONDITION_REQUIRED]: 'PRECONDITION_REQUIRED',
  [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',

  // 5xx
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
  [HttpStatus.NOT_IMPLEMENTED]: 'NOT_IMPLEMENTED',
  [HttpStatus.BAD_GATEWAY]: 'BAD_GATEWAY',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
  [HttpStatus.GATEWAY_TIMEOUT]: 'GATEWAY_TIMEOUT',
  [HttpStatus.HTTP_VERSION_NOT_SUPPORTED]: 'HTTP_VERSION_NOT_SUPPORTED',
  [HttpStatus.INSUFFICIENT_STORAGE]: 'INSUFFICIENT_STORAGE',
  [HttpStatus.LOOP_DETECTED]: 'LOOP_DETECTED',
};

export function mapHttpStatusToErrorCode(status: number): string {
  return STATUS_MAP[status] ?? 'UNKNOWN_ERROR';
}
