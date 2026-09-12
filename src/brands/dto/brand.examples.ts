/** نمونه UUIDها برای Swagger — فقط مستندات */
export const BRAND_EXAMPLES = {
  brandId: '550e8400-e29b-41d4-a716-446655440001',
  slug: 'samsung',
  name: 'سامسونگ',
  nameEn: 'Samsung',
  logoUrl: 'https://cdn.example.com/brands/samsung.png',
  seoDescription: 'برند سامسونگ — محصولات الکترونیک و موبایل',
  createdAt: '2026-09-02T10:00:00.000Z',
} as const;

export const CREATE_BRAND_EXAMPLE = {
  name: BRAND_EXAMPLES.name,
  nameEn: BRAND_EXAMPLES.nameEn,
  slug: BRAND_EXAMPLES.slug,
  logoUrl: BRAND_EXAMPLES.logoUrl,
  seoDescription: BRAND_EXAMPLES.seoDescription,
  isActive: true,
} as const;

export const BRAND_RESPONSE_EXAMPLE = {
  id: BRAND_EXAMPLES.brandId,
  name: BRAND_EXAMPLES.name,
  nameEn: BRAND_EXAMPLES.nameEn,
  slug: BRAND_EXAMPLES.slug,
  logoUrl: BRAND_EXAMPLES.logoUrl,
  seoDescription: BRAND_EXAMPLES.seoDescription,
  isActive: true,
  createdAt: BRAND_EXAMPLES.createdAt,
  updatedAt: BRAND_EXAMPLES.createdAt,
};
