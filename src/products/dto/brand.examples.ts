/** نمونه UUIDها برای Swagger — فقط مستندات */
export const BRAND_EXAMPLES = {
  brandId: '550e8400-e29b-41d4-a716-446655440001',
  slug: 'samsung',
  name: 'سامسونگ',
  createdAt: '2026-09-02T10:00:00.000Z',
} as const;

export const BRAND_RESPONSE_EXAMPLE = {
  id: BRAND_EXAMPLES.brandId,
  name: BRAND_EXAMPLES.name,
  slug: BRAND_EXAMPLES.slug,
  description: null,
  isActive: true,
  createdAt: BRAND_EXAMPLES.createdAt,
  updatedAt: BRAND_EXAMPLES.createdAt,
};
