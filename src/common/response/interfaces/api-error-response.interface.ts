import type { ApiFieldError } from './api-field-error.interface.js';

export interface ApiErrorResponse {
  code: string;
  message: string;
  errors?: ApiFieldError[];
}
