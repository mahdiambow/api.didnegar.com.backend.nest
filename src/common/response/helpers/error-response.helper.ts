import type { ApiFieldError } from '../interfaces/api-field-error.interface.js';
import type { ApiErrorResponse } from '../interfaces/api-error-response.interface.js';

export function errorResponse(
  code: string,
  message: string,
  errors?: ApiFieldError[],
): ApiErrorResponse {
  return errors?.length ? { code, message, errors } : { code, message };
}
