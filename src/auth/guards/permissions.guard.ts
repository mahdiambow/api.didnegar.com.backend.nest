import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiException } from '../../common/exceptions/api.exception.js';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator.js';
import { RoleRepository } from '../../roles/repositories/role.repository.js';
import { resolveUserRoles, type AuthUser } from '../types/auth-user.type.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly roleRepository: RoleRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;

    if (!user) {
      throw new UnauthorizedException('احراز هویت نشده‌اید');
    }

    const roleSlugs = resolveUserRoles(user.role, user.roles);
    const permissions = new Set<string>();

    for (const slug of roleSlugs) {
      const role = await this.roleRepository.findBySlug(slug);
      if (role) {
        for (const permission of role.permissions) {
          permissions.add(permission);
        }
      }
    }

    if (permissions.size === 0) {
      throw new ApiException(
        'ROLE_NOT_FOUND',
        'نقش کاربر یافت نشد',
        HttpStatus.FORBIDDEN,
      );
    }

    const missing = required.filter(
      (permission) => !permissions.has(permission),
    );

    if (missing.length) {
      throw new ApiException(
        'FORBIDDEN',
        `دسترسی لازم را ندارید: ${missing.join(', ')}`,
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}
