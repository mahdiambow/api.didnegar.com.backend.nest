import type { ApiSuccessResponse } from '../interfaces/api-success-response.interface.js';

export function successResponse<T>(
  code: string,
  message: string,
  data: T,
): ApiSuccessResponse<T> {
  return { code, message, data };
}
