export const ATTRIBUTE_EXAMPLES = {
  attributeId: '550e8400-e29b-41d4-a716-446655440060',
  createdAt: '2026-09-02T10:00:00.000Z',
} as const;

export const ATTRIBUTE_RESPONSE_EXAMPLE = {
  id: ATTRIBUTE_EXAMPLES.attributeId,
  name: 'storage',
  label: 'حافظه',
  isPublic: true,
  createdAt: ATTRIBUTE_EXAMPLES.createdAt,
  updatedAt: ATTRIBUTE_EXAMPLES.createdAt,
};

export const CREATE_ATTRIBUTE_EXAMPLE = {
  name: 'storage',
  label: 'حافظه',
  isPublic: true,
};
