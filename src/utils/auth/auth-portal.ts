import { DEFAULT_ROLE_SLUGS } from '../../roles/permissions.js';

export type AuthPortal = 'user' | 'seller' | 'admin';

/**
 * نقش‌های مجاز برای ورود به هر پورتال.
 * پورتال user برای همهٔ حساب‌ها باز است (ادمین/فروشنده هم می‌توانند خرید کنند).
 * پورتال‌های seller/admin فقط نقش‌های همان حوزه را می‌پذیرند.
 */
export const AUTH_PORTAL_ROLES: Record<AuthPortal, readonly string[] | null> = {
  user: null,
  seller: [DEFAULT_ROLE_SLUGS.SELLER, DEFAULT_ROLE_SLUGS.SUPER_SELLER],
  admin: [DEFAULT_ROLE_SLUGS.ADMIN, DEFAULT_ROLE_SLUGS.SUPER_ADMIN],
};
