/** نمونه ULIDها برای Swagger — فقط مستندات */
export const CATEGORY_EXAMPLES = {
  parentCategoryId: '01JEX000000000000000000090',
  categoryId: '01JEX000000000000000000100',
  subCategoryId: '01JEX000000000000000000080',
  productId: '01JEX000000000000000000010',
  productCategoryId: '01JEX000000000000000000110',
  createdAt: '2026-09-02T10:00:00.000Z',
} as const;

export const PARENT_CATEGORY_RESPONSE_EXAMPLE = {
  id: CATEGORY_EXAMPLES.parentCategoryId,
  name: 'کالای دیجیتال',
  nameEn: 'Digital',
  slug: 'digital',
  icon: 'https://cdn.example.com/categories/digital-icon.svg',
  image: 'https://cdn.example.com/categories/digital.jpg',
  sort: 0,
  isActive: true,
  createdAt: CATEGORY_EXAMPLES.createdAt,
};

export const CATEGORY_RESPONSE_EXAMPLE = {
  id: CATEGORY_EXAMPLES.categoryId,
  parentCategoryId: CATEGORY_EXAMPLES.parentCategoryId,
  name: 'موبایل',
  nameEn: 'Mobile',
  slug: 'mobile',
  icon: 'https://cdn.example.com/categories/mobile-icon.svg',
  image: 'https://cdn.example.com/categories/mobile.jpg',
  sort: 0,
  isActive: true,
  createdAt: CATEGORY_EXAMPLES.createdAt,
  parentCategory: PARENT_CATEGORY_RESPONSE_EXAMPLE,
};

export const SUB_CATEGORY_RESPONSE_EXAMPLE = {
  id: CATEGORY_EXAMPLES.subCategoryId,
  categoryId: CATEGORY_EXAMPLES.categoryId,
  parentCategoryId: CATEGORY_EXAMPLES.parentCategoryId,
  name: 'گوشی',
  nameEn: 'Phones',
  slug: 'phones',
  icon: 'https://cdn.example.com/categories/phones-icon.svg',
  image: 'https://cdn.example.com/categories/phones.jpg',
  sort: 0,
  isActive: true,
  createdAt: CATEGORY_EXAMPLES.createdAt,
  parentCategory: PARENT_CATEGORY_RESPONSE_EXAMPLE,
  category: CATEGORY_RESPONSE_EXAMPLE,
};

export const PRODUCT_CATEGORY_LINK_EXAMPLE = {
  categoryId: CATEGORY_EXAMPLES.categoryId,
  subCategoryId: CATEGORY_EXAMPLES.subCategoryId,
  isPrimary: true,
  position: 0,
};

export const CREATE_PRODUCT_CATEGORY_EXAMPLE = {
  productId: CATEGORY_EXAMPLES.productId,
  ...PRODUCT_CATEGORY_LINK_EXAMPLE,
};

export const PRODUCT_CATEGORY_RESPONSE_EXAMPLE = {
  id: CATEGORY_EXAMPLES.productCategoryId,
  productId: CATEGORY_EXAMPLES.productId,
  categoryId: CATEGORY_EXAMPLES.categoryId,
  subCategoryId: CATEGORY_EXAMPLES.subCategoryId,
  isPrimary: true,
  position: 0,
  createdAt: CATEGORY_EXAMPLES.createdAt,
  updatedAt: CATEGORY_EXAMPLES.createdAt,
  category: CATEGORY_RESPONSE_EXAMPLE,
  subCategory: SUB_CATEGORY_RESPONSE_EXAMPLE,
};
