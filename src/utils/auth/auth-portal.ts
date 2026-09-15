import { DEFAULT_ROLE_SLUGS } from '../../roles/permissions.js';

export type AuthPortal = 'user' | 'seller' | 'admin';

/** نقش‌های مجاز برای ورود به هر پورتال */
export const AUTH_PORTAL_ROLES: Record<AuthPortal, readonly string[]> = {
  user: [DEFAULT_ROLE_SLUGS.USER],
  seller: [DEFAULT_ROLE_SLUGS.SELLER, DEFAULT_ROLE_SLUGS.SUPER_SELLER],
  admin: [DEFAULT_ROLE_SLUGS.ADMIN, DEFAULT_ROLE_SLUGS.SUPER_ADMIN],
};
