import { ValidationError } from 'class-validator';
import type { ApiFieldError } from '../response/interfaces/api-field-error.interface.js';

export function flattenValidationErrors(
  errors: ValidationError[],
  parentField = '',
): ApiFieldError[] {
  const result: ApiFieldError[] = [];

  for (const error of errors) {
    const field = parentField
      ? `${parentField}.${error.property}`
      : error.property;

    if (error.constraints) {
      for (const message of Object.values(error.constraints)) {
        result.push({ field, message });
      }
    }

    if (error.children?.length) {
      result.push(...flattenValidationErrors(error.children, field));
    }
  }

  return result;
}
