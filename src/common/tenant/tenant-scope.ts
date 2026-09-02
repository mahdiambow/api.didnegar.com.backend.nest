import type { AuthUser } from '../../auth/types/auth-user.type.js';
import { isSuperAdminRole } from '../../roles/permissions.js';

export type TenantScope = AuthUser;

export function isSuperAdmin(scope: TenantScope): boolean {
  return isSuperAdminRole(scope.role);
}
