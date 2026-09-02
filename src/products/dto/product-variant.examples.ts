import { ATTRIBUTE_VALUE_RESPONSE_EXAMPLE, ATTRIBUTE_EXAMPLES } from '../../attributes/dto/attribute.examples.js';

export const PRODUCT_ATTRIBUTE_EXAMPLES = {
  attributeId: '550e8400-e29b-41d4-a716-446655440030',
  productId: '550e8400-e29b-41d4-a716-446655440000',
  variantValueId: '550e8400-e29b-41d4-a716-446655440040',
  productAttributeVariantId: '550e8400-e29b-41d4-a716-446655440050',
  createdAt: '2026-09-02T10:00:00.000Z',
} as const;

export const PRODUCT_ATTRIBUTE_RESPONSE_EXAMPLE = {
  id: PRODUCT_ATTRIBUTE_EXAMPLES.attributeId,
  productId: PRODUCT_ATTRIBUTE_EXAMPLES.productId,
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
  createdAt: PRODUCT_ATTRIBUTE_EXAMPLES.createdAt,
  updatedAt: PRODUCT_ATTRIBUTE_EXAMPLES.createdAt,
  variants: [
    {
      id: PRODUCT_ATTRIBUTE_EXAMPLES.productAttributeVariantId,
      attributeId: PRODUCT_ATTRIBUTE_EXAMPLES.attributeId,
      variantValueId: PRODUCT_ATTRIBUTE_EXAMPLES.variantValueId,
      createdAt: PRODUCT_ATTRIBUTE_EXAMPLES.createdAt,
      variantValue: ATTRIBUTE_VALUE_RESPONSE_EXAMPLE,
    },
  ],
};

export const CREATE_PRODUCT_ATTRIBUTE_EXAMPLE = {
  productId: PRODUCT_ATTRIBUTE_EXAMPLES.productId,
  sku: 'SAM-S24U-256-BLK',
  minPrice: 65000000,
  maxPrice: 72000000,
  stockQuantity: 10,
  stockStatus: 'instock',
  description: 'Galaxy S24 Ultra 256GB مشکی',
  isActive: true,
};

export const CREATE_PRODUCT_ATTRIBUTE_VARIANT_EXAMPLE = {
  attributeId: PRODUCT_ATTRIBUTE_EXAMPLES.attributeId,
  variantValueId: ATTRIBUTE_EXAMPLES.variantValueId,
};

/** @deprecated use PRODUCT_ATTRIBUTE_EXAMPLES */
export const VARIANT_EXAMPLES = PRODUCT_ATTRIBUTE_EXAMPLES;
/** @deprecated use PRODUCT_ATTRIBUTE_RESPONSE_EXAMPLE */
export const PRODUCT_VARIANT_RESPONSE_EXAMPLE = PRODUCT_ATTRIBUTE_RESPONSE_EXAMPLE;
/** @deprecated use CREATE_PRODUCT_ATTRIBUTE_EXAMPLE */
export const CREATE_PRODUCT_VARIANT_EXAMPLE = CREATE_PRODUCT_ATTRIBUTE_EXAMPLE;
/** @deprecated use CREATE_PRODUCT_ATTRIBUTE_VARIANT_EXAMPLE */
export const CREATE_PRODUCT_VARIANT_ATTRIBUTE_EXAMPLE =
  CREATE_PRODUCT_ATTRIBUTE_VARIANT_EXAMPLE;
