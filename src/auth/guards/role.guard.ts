import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiException } from '../../common/exceptions/api.exception.js';
import { ROLES_KEY } from '../decorators/require-role.decorator.js';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as { sub: string; role: string } | undefined;

    if (!user) {
      throw new UnauthorizedException('احراز هویت نشده‌اید');
    }

    if (!required.includes(user.role)) {
      throw new ApiException(
        'FORBIDDEN',
        `فقط نقش‌های ${required.join(', ')} مجاز هستند`,
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}
