export const VARIANT_EXAMPLES = {
  variantId: '550e8400-e29b-41d4-a716-446655440060',
  variantValueId: '550e8400-e29b-41d4-a716-446655440040',
  createdAt: '2026-09-02T10:00:00.000Z',
} as const;

export const VARIANT_RESPONSE_EXAMPLE = {
  id: VARIANT_EXAMPLES.variantId,
  name: 'storage',
  label: 'حافظه',
  isPublic: true,
  createdAt: VARIANT_EXAMPLES.createdAt,
  updatedAt: VARIANT_EXAMPLES.createdAt,
};

export const VARIANT_VALUE_RESPONSE_EXAMPLE = {
  id: VARIANT_EXAMPLES.variantValueId,
  variantId: VARIANT_EXAMPLES.variantId,
  value: '256GB',
  slug: '256gb',
  createdAt: VARIANT_EXAMPLES.createdAt,
  variant: VARIANT_RESPONSE_EXAMPLE,
};

export const CREATE_VARIANT_EXAMPLE = {
  name: 'storage',
  label: 'حافظه',
  isPublic: true,
  variantValueIds: [VARIANT_EXAMPLES.variantValueId],
};

export const CREATE_VARIANT_VALUE_EXAMPLE = {
  value: '256GB',
  slug: '256gb',
};

/** @deprecated use VARIANT_EXAMPLES */
export const ATTRIBUTE_EXAMPLES = VARIANT_EXAMPLES;
/** @deprecated use VARIANT_RESPONSE_EXAMPLE */
export const ATTRIBUTE_RESPONSE_EXAMPLE = VARIANT_RESPONSE_EXAMPLE;
/** @deprecated use VARIANT_VALUE_RESPONSE_EXAMPLE */
export const ATTRIBUTE_VALUE_RESPONSE_EXAMPLE = VARIANT_VALUE_RESPONSE_EXAMPLE;
/** @deprecated use CREATE_VARIANT_EXAMPLE */
export const CREATE_ATTRIBUTE_EXAMPLE = CREATE_VARIANT_EXAMPLE;
/** @deprecated use CREATE_VARIANT_VALUE_EXAMPLE */
export const CREATE_ATTRIBUTE_VALUE_EXAMPLE = CREATE_VARIANT_VALUE_EXAMPLE;
