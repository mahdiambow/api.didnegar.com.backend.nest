export const MEDIA_STATUSES = ['pending', 'approved', 'rejected'] as const;

export type MediaStatus = (typeof MEDIA_STATUSES)[number];

export const MEDIA_STORAGE_LOCATIONS = ['staging', 'gallery'] as const;

export type MediaStorageLocation = (typeof MEDIA_STORAGE_LOCATIONS)[number];

export const MEDIA_GROUPS = [
  'blog',
  'product',
  'banner',
  'setting',
  'seller',
  'other',
] as const;

export type MediaGroup = (typeof MEDIA_GROUPS)[number];

/**
 * `legacy` is retained for the previous SFTP gallery rows. `gallery` is a
 * seller-owned SeaweedFS upload that is not yet attached to a product.
 */
export const MEDIA_SCOPES = ['legacy', 'product', 'banner', 'gallery'] as const;

export type MediaScope = (typeof MEDIA_SCOPES)[number];
