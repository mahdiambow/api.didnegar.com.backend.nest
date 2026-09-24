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
 * `legacy` is retained for the previous SFTP gallery rows. New direct uploads
 * always use product or banner and are stored in SeaweedFS.
 */
export const MEDIA_SCOPES = ['legacy', 'product', 'banner'] as const;

export type MediaScope = (typeof MEDIA_SCOPES)[number];
