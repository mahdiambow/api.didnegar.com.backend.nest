import { UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import { flattenValidationErrors } from '../utils/validation.util.js';

export function createValidationPipe() {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    exceptionFactory: (errors) =>
      new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        errors: flattenValidationErrors(errors),
      }),
  });
}
