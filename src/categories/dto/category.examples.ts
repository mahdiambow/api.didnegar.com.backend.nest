/** نمونه UUIDها برای Swagger — فقط مستندات */
export const CATEGORY_EXAMPLES = {
  categoryId: '550e8400-e29b-41d4-a716-446655440010',
  subCategoryId: '550e8400-e29b-41d4-a716-446655440011',
  productId: '550e8400-e29b-41d4-a716-446655440000',
  productCategoryId: '550e8400-e29b-41d4-a716-446655440020',
  createdAt: '2026-09-02T10:00:00.000Z',
} as const;

export const CATEGORY_RESPONSE_EXAMPLE = {
  id: CATEGORY_EXAMPLES.categoryId,
  name: 'موبایل',
  slug: 'mobile',
  createdAt: CATEGORY_EXAMPLES.createdAt,
};

export const SUB_CATEGORY_RESPONSE_EXAMPLE = {
  id: CATEGORY_EXAMPLES.subCategoryId,
  categoryId: CATEGORY_EXAMPLES.categoryId,
  name: 'گوشی',
  slug: 'phones',
  createdAt: CATEGORY_EXAMPLES.createdAt,
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
