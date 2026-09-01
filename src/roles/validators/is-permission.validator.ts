import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isValidPermission } from '../permissions.js';

@ValidatorConstraint({ name: 'isPermission', async: false })
export class IsPermissionConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    return typeof value === 'string' && isValidPermission(value);
  }

  defaultMessage() {
    return 'دسترسی نامعتبر است';
  }
}

export function IsPermission(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPermissionConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'isPermissionArray', async: false })
export class IsPermissionArrayConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    if (!Array.isArray(value)) {
      return false;
    }

    return value.every(
      (item) => typeof item === 'string' && isValidPermission(item),
    );
  }

  defaultMessage() {
    return 'هر permission باید یکی از مقادیر تعریف‌شده در permissions.ts باشد';
  }
}

export function IsPermissionArray(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPermissionArrayConstraint,
    });
  };
}
