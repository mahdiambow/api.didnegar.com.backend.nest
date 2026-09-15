import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../common/exceptions/api.exception.js';
import type { Role } from './entities/role.entity.js';
import { RoleAudience } from './role-audience.enum.js';

/** همه نقش‌های یک کاربر باید audience یکسان داشته باشند */
export function assertCompatibleRoleAudiences(roles: Role[]) {
  if (roles.length <= 1) return;

  const audiences = [...new Set(roles.map((role) => role.audience))];
  if (audiences.length > 1) {
    throw new ApiException(
      'ROLE_AUDIENCE_MISMATCH',
      'نمی‌توان نقش‌های حوزه‌های مختلف را با هم ترکیب کرد (مثلاً super-admin با user یا seller)',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export function resolveRoleAudience(options: {
  sellerId: string | null;
  audience?: RoleAudience;
}): RoleAudience {
  if (options.sellerId) {
    return RoleAudience.SELLER;
  }
  return options.audience ?? RoleAudience.ADMIN;
}
