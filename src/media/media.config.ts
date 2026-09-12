function parsePositiveInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export const mediaConfig = {
  stagingRoot:
    process.env.MEDIA_STAGING_ROOT?.trim() ||
    './storage/media/staging',
  galleryRoot:
    process.env.MEDIA_GALLERY_ROOT?.trim() ||
    './storage/media/gallery',
  publicBaseUrl: (
    process.env.MEDIA_PUBLIC_BASE_URL?.trim() ||
    'http://localhost:3000/media-files'
  ).replace(/\/$/, ''),
  maxFileBytes: parsePositiveInt(
    process.env.MEDIA_MAX_FILE_BYTES,
    5 * 1024 * 1024,
  ),
  dailyUploadQuota: parsePositiveInt(
    process.env.MEDIA_DAILY_UPLOAD_QUOTA,
    50,
  ),
  pendingTtlHours: parsePositiveInt(process.env.MEDIA_PENDING_TTL_HOURS, 72),
  rejectedTtlHours: parsePositiveInt(process.env.MEDIA_REJECTED_TTL_HOURS, 24),
  cleanupCron: process.env.MEDIA_CLEANUP_CRON?.trim() || '59 23 * * *',
  cleanupTz: process.env.MEDIA_CLEANUP_TZ?.trim() || 'Asia/Tehran',
  allowedMimeTypes: (
    process.env.MEDIA_ALLOWED_MIME_TYPES?.trim() ||
    'image/jpeg,image/png,image/webp,image/gif'
  )
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean),
  uploadRate: {
    name: 'media-upload',
    ttl: parsePositiveInt(process.env.MEDIA_UPLOAD_RATE_TTL_MS, 60_000),
    limit: parsePositiveInt(process.env.MEDIA_UPLOAD_RATE_LIMIT, 10),
  },
} as const;
