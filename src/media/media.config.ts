function parsePositiveInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

const sftpHost = process.env.MEDIA_SFTP_HOST?.trim() || '';

export const mediaConfig = {
  /** When host is set, files are stored via SFTP on the remote server. */
  sftp: {
    enabled: Boolean(sftpHost),
    host: sftpHost,
    port: parsePositiveInt(process.env.MEDIA_SFTP_PORT, 22),
    username: process.env.MEDIA_SFTP_USERNAME?.trim() || 'developer',
    password: (process.env.MEDIA_SFTP_PASSWORD ?? '').trim(),
    privateKeyPath: process.env.MEDIA_SFTP_PRIVATE_KEY_PATH?.trim() || '',
    privateKey: process.env.MEDIA_SFTP_PRIVATE_KEY?.trim() || '',
    /** Absolute remote base, e.g. /var/www */
    root: (process.env.MEDIA_SFTP_ROOT?.trim() || '/var/www').replace(
      /\/$/,
      '',
    ),
  },
  /** Relative to SFTP root when remote, or local path when not */
  stagingRoot:
    process.env.MEDIA_STAGING_ROOT?.trim() ||
    (sftpHost ? 'media/staging' : './storage/media/staging'),
  galleryRoot:
    process.env.MEDIA_GALLERY_ROOT?.trim() ||
    (sftpHost ? 'media/gallery' : './storage/media/gallery'),
  publicBaseUrl: (
    process.env.MEDIA_PUBLIC_BASE_URL?.trim() ||
    (sftpHost
      ? `http://${sftpHost}/media`
      : 'http://localhost:3000/media-files')
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
