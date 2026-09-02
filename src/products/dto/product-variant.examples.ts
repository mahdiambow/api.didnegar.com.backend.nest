export const VARIANT_EXAMPLES = {
  variantId: '550e8400-e29b-41d4-a716-446655440030',
  productId: '550e8400-e29b-41d4-a716-446655440000',
  attributeValueId: '550e8400-e29b-41d4-a716-446655440040',
  variantAttributeId: '550e8400-e29b-41d4-a716-446655440050',
  createdAt: '2026-09-02T10:00:00.000Z',
} as const;

export const ATTRIBUTE_VALUE_RESPONSE_EXAMPLE = {
  id: VARIANT_EXAMPLES.attributeValueId,
  value: '256GB',
  slug: '256gb',
  createdAt: VARIANT_EXAMPLES.createdAt,
  updatedAt: VARIANT_EXAMPLES.createdAt,
};

export const PRODUCT_VARIANT_RESPONSE_EXAMPLE = {
  id: VARIANT_EXAMPLES.variantId,
  productId: VARIANT_EXAMPLES.productId,
  sku: 'SAM-S24U-256-BLK',
  minPrice: 65000000,
  maxPrice: 72000000,
  isVirtual: false,
  isDownloadable: false,
  stockQuantity: 10,
  stockStatus: 'instock',
  taxStatus: null,
  taxClass: null,
  description: 'Galaxy S24 Ultra 256GB مشکی',
  status: 'publish',
  weight: null,
  length: null,
  width: null,
  height: null,
  isActive: true,
  createdAt: VARIANT_EXAMPLES.createdAt,
  updatedAt: VARIANT_EXAMPLES.createdAt,
  attributes: [
    {
      id: VARIANT_EXAMPLES.variantAttributeId,
      variantId: VARIANT_EXAMPLES.variantId,
      attributeValueId: VARIANT_EXAMPLES.attributeValueId,
      createdAt: VARIANT_EXAMPLES.createdAt,
      attributeValue: ATTRIBUTE_VALUE_RESPONSE_EXAMPLE,
    },
  ],
};

export const CREATE_PRODUCT_VARIANT_EXAMPLE = {
  productId: VARIANT_EXAMPLES.productId,
  sku: 'SAM-S24U-256-BLK',
  minPrice: 65000000,
  maxPrice: 72000000,
  stockQuantity: 10,
  stockStatus: 'instock',
  description: 'Galaxy S24 Ultra 256GB مشکی',
  isActive: true,
};

export const ASSIGN_VARIANT_ATTRIBUTE_EXAMPLE = {
  attributeValueId: VARIANT_EXAMPLES.attributeValueId,
};
