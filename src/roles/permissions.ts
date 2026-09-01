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
  inventory: {
    read: 'inventory:read',
    create: 'inventory:create',
    update: 'inventory:update',
    delete: 'inventory:delete',
  },
  orders: {
    read: 'orders:read',
    create: 'orders:create',
    update: 'orders:update',
    delete: 'orders:delete',
  },
  settings: {
    read: 'settings:read',
    update: 'settings:update',
  },
  sellers: {
    read: 'sellers:read',
    create: 'sellers:create',
    update: 'sellers:update',
    delete: 'sellers:delete',
  },
  contracts: {
    read: 'contracts:read',
    create: 'contracts:create',
    update: 'contracts:update',
    delete: 'contracts:delete',
  },
  locations: {
    read: 'locations:read',
    create: 'locations:create',
    update: 'locations:update',
    delete: 'locations:delete',
  },
  auth: {
    manage: 'auth:manage',
  },
} as const;

export const LOCATION_PERMISSIONS = PERMISSIONS.locations;

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
    key: PERMISSIONS.inventory.read,
    label: 'مشاهده موجودی',
    group: 'inventory',
  },
  {
    key: PERMISSIONS.inventory.create,
    label: 'ایجاد موجودی',
    group: 'inventory',
  },
  {
    key: PERMISSIONS.inventory.update,
    label: 'ویرایش موجودی',
    group: 'inventory',
  },
  {
    key: PERMISSIONS.inventory.delete,
    label: 'حذف موجودی',
    group: 'inventory',
  },
  {
    key: PERMISSIONS.orders.read,
    label: 'مشاهده سفارش‌ها',
    group: 'orders',
  },
  {
    key: PERMISSIONS.orders.create,
    label: 'ایجاد سفارش',
    group: 'orders',
  },
  {
    key: PERMISSIONS.orders.update,
    label: 'ویرایش سفارش',
    group: 'orders',
  },
  {
    key: PERMISSIONS.orders.delete,
    label: 'حذف سفارش',
    group: 'orders',
  },
  {
    key: PERMISSIONS.settings.read,
    label: 'مشاهده تنظیمات',
    group: 'settings',
  },
  {
    key: PERMISSIONS.settings.update,
    label: 'ویرایش تنظیمات',
    group: 'settings',
  },
  {
    key: PERMISSIONS.sellers.read,
    label: 'مشاهده فروشندگان',
    group: 'sellers',
  },
  {
    key: PERMISSIONS.sellers.create,
    label: 'ایجاد فروشنده',
    group: 'sellers',
  },
  {
    key: PERMISSIONS.sellers.update,
    label: 'ویرایش فروشنده',
    group: 'sellers',
  },
  {
    key: PERMISSIONS.sellers.delete,
    label: 'حذف فروشنده',
    group: 'sellers',
  },
  {
    key: PERMISSIONS.contracts.read,
    label: 'مشاهده قراردادها',
    group: 'contracts',
  },
  {
    key: PERMISSIONS.contracts.create,
    label: 'ایجاد قرارداد',
    group: 'contracts',
  },
  {
    key: PERMISSIONS.contracts.update,
    label: 'ویرایش قرارداد',
    group: 'contracts',
  },
  {
    key: PERMISSIONS.contracts.delete,
    label: 'حذف قرارداد',
    group: 'contracts',
  },
  {
    key: PERMISSIONS.locations.read,
    label: 'مشاهده مکان‌ها',
    group: 'locations',
  },
  {
    key: PERMISSIONS.locations.create,
    label: 'ایجاد مکان',
    group: 'locations',
  },
  {
    key: PERMISSIONS.locations.update,
    label: 'ویرایش مکان',
    group: 'locations',
  },
  {
    key: PERMISSIONS.locations.delete,
    label: 'حذف مکان',
    group: 'locations',
  },
  {
    key: PERMISSIONS.auth.manage,
    label: 'مدیریت احراز هویت',
    group: 'auth',
  },
] as const satisfies ReadonlyArray<{
  key: string;
  label: string;
  group: string;
}>;

export type Permission = (typeof PERMISSION_DEFINITIONS)[number]['key'];

export const ALL_PERMISSIONS: readonly Permission[] =
  PERMISSION_DEFINITIONS.map((item) => item.key);

export const DEFAULT_ROLE_SLUGS = {
  USER: 'user',
  SELLER: 'seller',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super-admin',
} as const;

export type DefaultRoleSlug =
  (typeof DEFAULT_ROLE_SLUGS)[keyof typeof DEFAULT_ROLE_SLUGS];

const SELLER_PERMISSIONS: Permission[] = [
  PERMISSIONS.inventory.read,
  PERMISSIONS.inventory.create,
  PERMISSIONS.inventory.update,
  PERMISSIONS.inventory.delete,
  PERMISSIONS.orders.read,
  PERMISSIONS.orders.create,
  PERMISSIONS.orders.update,
  PERMISSIONS.orders.delete,
  PERMISSIONS.settings.read,
  PERMISSIONS.settings.update,
  PERMISSIONS.users.read,
  PERMISSIONS.users.create,
  PERMISSIONS.users.update,
  PERMISSIONS.users.delete,
  PERMISSIONS.roles.read,
  PERMISSIONS.roles.create,
  PERMISSIONS.roles.update,
  PERMISSIONS.roles.delete,
  PERMISSIONS.sellers.read,
  PERMISSIONS.sellers.update,
  PERMISSIONS.contracts.read,
  PERMISSIONS.contracts.create,
  PERMISSIONS.contracts.update,
  PERMISSIONS.contracts.delete,
  PERMISSIONS.locations.read,
];

export const DEFAULT_ROLE_PERMISSIONS: Record<
  DefaultRoleSlug,
  readonly Permission[]
> = {
  [DEFAULT_ROLE_SLUGS.USER]: [],
  [DEFAULT_ROLE_SLUGS.SELLER]: SELLER_PERMISSIONS,
  [DEFAULT_ROLE_SLUGS.ADMIN]: [],
  [DEFAULT_ROLE_SLUGS.SUPER_ADMIN]: ALL_PERMISSIONS,
};

export function isSuperAdminRole(roleSlug: string): boolean {
  return roleSlug === DEFAULT_ROLE_SLUGS.SUPER_ADMIN;
}

export function isValidPermission(permission: string): permission is Permission {
  return (ALL_PERMISSIONS as readonly string[]).includes(permission);
}

export const SUPER_ADMIN_ONLY_PERMISSIONS: readonly Permission[] = [
  PERMISSIONS.sellers.create,
  PERMISSIONS.sellers.delete,
  PERMISSIONS.auth.manage,
  PERMISSIONS.locations.create,
  PERMISSIONS.locations.update,
  PERMISSIONS.locations.delete,
] as const;

export const SELLER_ASSIGNABLE_PERMISSIONS: readonly Permission[] =
  ALL_PERMISSIONS.filter(
    (permission) => !SUPER_ADMIN_ONLY_PERMISSIONS.includes(permission),
  );

export function isSellerAssignablePermission(
  permission: string,
): permission is Permission {
  return (
    isValidPermission(permission) &&
    SELLER_ASSIGNABLE_PERMISSIONS.includes(permission)
  );
}

export function getInvalidPermissions(permissions: string[]): string[] {
  return permissions.filter((permission) => !isValidPermission(permission));
}

export function getNonAssignableSellerPermissions(
  permissions: string[],
): string[] {
  return permissions.filter(
    (permission) =>
      isValidPermission(permission) &&
      !SELLER_ASSIGNABLE_PERMISSIONS.includes(permission),
  );
}

export function validatePermissions(permissions: string[]): string[] {
  const invalid = permissions.filter((p) => !isValidPermission(p));
  if (invalid.length) {
    return invalid;
  }
  return permissions;
}
