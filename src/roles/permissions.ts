export const PERMISSIONS = {
  users: {
    read: 'users:read',
    create: 'users:create',
    update: 'users:update',
    delete: 'users:delete',
  },
  roles: {
    read: 'roles:read',
    create: 'roles:create',
    update: 'roles:update',
    delete: 'roles:delete',
  },
  auth: {
    manage: 'auth:manage',
  },
} as const;

export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS][keyof (typeof PERMISSIONS)[keyof typeof PERMISSIONS]];

export const PERMISSION_DEFINITIONS = [
  {
    key: PERMISSIONS.users.read,
    label: 'مشاهده کاربران',
    group: 'users',
  },
  {
    key: PERMISSIONS.users.create,
    label: 'ایجاد کاربر',
    group: 'users',
  },
  {
    key: PERMISSIONS.users.update,
    label: 'ویرایش کاربر',
    group: 'users',
  },
  {
    key: PERMISSIONS.users.delete,
    label: 'حذف کاربر',
    group: 'users',
  },
  {
    key: PERMISSIONS.roles.read,
    label: 'مشاهده نقش‌ها',
    group: 'roles',
  },
  {
    key: PERMISSIONS.roles.create,
    label: 'ایجاد نقش',
    group: 'roles',
  },
  {
    key: PERMISSIONS.roles.update,
    label: 'ویرایش نقش',
    group: 'roles',
  },
  {
    key: PERMISSIONS.roles.delete,
    label: 'حذف نقش',
    group: 'roles',
  },
  {
    key: PERMISSIONS.auth.manage,
    label: 'مدیریت احراز هویت',
    group: 'auth',
  },
] as const;

export const ALL_PERMISSIONS: string[] = PERMISSION_DEFINITIONS.map(
  (item) => item.key,
);

export const DEFAULT_ROLE_SLUGS = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export const DEFAULT_ROLE_PERMISSIONS = {
  [DEFAULT_ROLE_SLUGS.USER]: [] as string[],
  [DEFAULT_ROLE_SLUGS.ADMIN]: [...ALL_PERMISSIONS],
} as const;

export function isValidPermission(permission: string): boolean {
  return ALL_PERMISSIONS.includes(permission);
}

export function validatePermissions(permissions: string[]): string[] {
  const invalid = permissions.filter((p) => !isValidPermission(p));
  if (invalid.length) {
    return invalid;
  }
  return permissions;
}
