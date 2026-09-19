import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../common/exceptions/api.exception.js';
import type { Role } from './entities/role.entity.js';
import { RoleAudience } from './role-audience.enum.js';

/**
 * نقش‌ها می‌توانند چند حوزه‌ای باشند (مثلاً user + super-admin).
 * فقط ترکیب seller با admin بدون نقش پایهٔ user ممنوع نیست؛
 * محدودیت قبلی حذف شد تا یک شماره بتواند چند رول داشته باشد.
 *
 * همچنان اگر لیست خالی/نامعتبر باشد خطا می‌دهد.
 */
export function assertCompatibleRoleAudiences(roles: Role[]) {
  if (!roles.length) {
    throw new ApiException(
      'ROLE_REQUIRED',
      'حداقل یک نقش باید انتخاب شود',
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

/** آیا کاربر حداقل یک نقش با audience مورد نظر دارد؟ */
export function hasAudience(
  audiences: Array<RoleAudience | string | null | undefined>,
  expected: RoleAudience,
): boolean {
  return audiences.some((audience) => audience === expected);
}
