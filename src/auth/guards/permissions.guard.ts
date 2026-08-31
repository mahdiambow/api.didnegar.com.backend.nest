import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiException } from '../../common/exceptions/api.exception.js';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator.js';
import { Role } from '../../roles/entities/role.entity.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
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
    const user = request.user as { sub: string; role: string } | undefined;

    if (!user) {
      throw new UnauthorizedException('احراز هویت نشده‌اید');
    }

    const role = await this.roleRepo.findOne({ where: { slug: user.role } });
    if (!role) {
      throw new ApiException(
        'ROLE_NOT_FOUND',
        'نقش کاربر یافت نشد',
        HttpStatus.FORBIDDEN,
      );
    }

    const missing = required.filter(
      (permission) => !role.permissions.includes(permission),
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
