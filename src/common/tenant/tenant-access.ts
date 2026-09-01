import type { AuthUser } from '../../auth/types/auth-user.type.js';
import { isSuperAdminRole } from '../../roles/permissions.js';

export function canAccessSellerData(
  user: AuthUser,
  targetSellerId: string | null | undefined,
): boolean {
  if (isSuperAdminRole(user.role)) {
    return true;
  }

  if (!targetSellerId || !user.sellerId) {
    return false;
  }

  return user.sellerId === targetSellerId;
}
