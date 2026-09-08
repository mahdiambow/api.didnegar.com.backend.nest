export type AuthUser = {
  sub: string;
  role: string;
  roles: string[];
  sellerId: string | null;
};

export function userHasRole(
  user: Pick<AuthUser, 'role' | 'roles'>,
  ...allowed: string[]
): boolean {
  const roles =
    user.roles?.length > 0 ? user.roles : user.role ? [user.role] : [];
  return allowed.some((role) => roles.includes(role));
}

export function resolveUserRoles(
  primaryRole: string,
  extraRoleSlugs: string[] | null | undefined = [],
): string[] {
  return [...new Set([primaryRole, ...(extraRoleSlugs ?? [])])];
}
