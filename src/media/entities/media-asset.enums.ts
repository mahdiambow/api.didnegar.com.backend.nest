export const MEDIA_STATUSES = ['pending', 'approved', 'rejected'] as const;

export type MediaStatus = (typeof MEDIA_STATUSES)[number];

export const MEDIA_STORAGE_LOCATIONS = ['staging', 'gallery'] as const;

export type MediaStorageLocation = (typeof MEDIA_STORAGE_LOCATIONS)[number];

export const MEDIA_GROUPS = [
  'blog',
  'product',
  'setting',
  'seller',
  'other',
] as const;

export type MediaGroup = (typeof MEDIA_GROUPS)[number];
