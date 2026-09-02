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
  products: {
    read: 'products:read',
    create: 'products:create',
    update: 'products:update',
    delete: 'products:delete',
    adjustPrices: 'products:adjust-prices',
    importPrices: 'products:import-prices',
  },
  orders: {
    read: 'orders:read',
    create: 'orders:create',
    update: 'orders:update',
  },
  payments: {
    read: 'payments:read',
    create: 'payments:create',
  },
  shipping: {
    read: 'shipping:read',
    create: 'shipping:create',
    update: 'shipping:update',
    delete: 'shipping:delete',
  },
  categories: {
    read: 'categories:read',
    create: 'categories:create',
    update: 'categories:update',
    delete: 'categories:delete',
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
  {
    key: PERMISSIONS.products.read,
    label: 'مشاهده محصولات',
    group: 'products',
  },
  {
    key: PERMISSIONS.products.create,
    label: 'ایجاد محصول',
    group: 'products',
  },
  {
    key: PERMISSIONS.products.update,
    label: 'ویرایش محصول',
    group: 'products',
  },
  {
    key: PERMISSIONS.products.delete,
    label: 'حذف محصول',
    group: 'products',
  },
  {
    key: PERMISSIONS.products.adjustPrices,
    label: 'تغییر گروهی قیمت محصولات',
    group: 'products',
  },
  {
    key: PERMISSIONS.products.importPrices,
    label: 'ایمپورت قیمت از اکسل',
    group: 'products',
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
    key: PERMISSIONS.payments.read,
    label: 'مشاهده پرداخت‌ها',
    group: 'payments',
  },
  {
    key: PERMISSIONS.payments.create,
    label: 'ایجاد پرداخت',
    group: 'payments',
  },
  {
    key: PERMISSIONS.shipping.read,
    label: 'مشاهده روش‌های ارسال',
    group: 'shipping',
  },
  {
    key: PERMISSIONS.shipping.create,
    label: 'ایجاد روش ارسال',
    group: 'shipping',
  },
  {
    key: PERMISSIONS.shipping.update,
    label: 'ویرایش روش ارسال',
    group: 'shipping',
  },
  {
    key: PERMISSIONS.shipping.delete,
    label: 'حذف روش ارسال',
    group: 'shipping',
  },
  {
    key: PERMISSIONS.categories.read,
    label: 'مشاهده دسته‌بندی‌ها',
    group: 'categories',
  },
  {
    key: PERMISSIONS.categories.create,
    label: 'ایجاد دسته‌بندی',
    group: 'categories',
  },
  {
    key: PERMISSIONS.categories.update,
    label: 'ویرایش دسته‌بندی',
    group: 'categories',
  },
  {
    key: PERMISSIONS.categories.delete,
    label: 'حذف دسته‌بندی',
    group: 'categories',
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
