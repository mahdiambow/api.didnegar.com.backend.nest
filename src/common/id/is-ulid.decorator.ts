import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isUlid } from './ulid.js';

@ValidatorConstraint({ name: 'isUlid', async: false })
export class IsUlidConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    return isUlid(value);
  }

  defaultMessage() {
    return '$property must be a ULID';
  }
}

/** اعتبارسنجی ULID — برای فیلد تکی یا each: true روی آرایه */
export function IsULID(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUlidConstraint,
    });
  };
}
