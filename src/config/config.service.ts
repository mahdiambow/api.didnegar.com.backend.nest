import { Injectable } from '@nestjs/common';
import { assertAppMysqlTarget } from './assert-app-mysql.js';

const REQUIRED = [
  // App
  'NODE_ENV',
  'PORT',

  // Database
  'DB_HOST',
  'DB_PORT',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_DATABASE',

  // Auth
  'JWT_SECRET',
] as const;

const DEFAULTS: Record<string, string> = {
  OTP_TTL_MINUTES: '2',
  ACCESS_TOKEN_TTL: '15m',
  REFRESH_TOKEN_TTL: '30d',
  OTP_SEND_LIMIT: '50',
  OTP_VERIFY_LIMIT: '50',
  LOGIN_LIMIT: '50',
  OTP_STATIC_CODE: '123456',
  SWAGGER_PERSIST_AUTH: 'false',
  SEED_ON_STARTUP: 'true',
  SEED_DEFAULT_PASSWORD: 'Admin@1234',
  MEDIA_SFTP_HOST: '',
  MEDIA_SFTP_PORT: '22',
  MEDIA_SFTP_USERNAME: 'developer',
  MEDIA_SFTP_PASSWORD: '',
  MEDIA_SFTP_PRIVATE_KEY_PATH: '',
  MEDIA_SFTP_PRIVATE_KEY: '',
  MEDIA_SFTP_ROOT: '/var/www',
  MEDIA_STAGING_ROOT: './storage/media/staging',
  MEDIA_GALLERY_ROOT: './storage/media/gallery',
  MEDIA_PUBLIC_BASE_URL: 'http://localhost:3000/media-files',
  MEDIA_MAX_FILE_BYTES: String(5 * 1024 * 1024),
  MEDIA_DAILY_UPLOAD_QUOTA: '50',
  MEDIA_PENDING_TTL_HOURS: '72',
  MEDIA_REJECTED_TTL_HOURS: '24',
  MEDIA_CLEANUP_CRON: '59 23 * * *',
  MEDIA_CLEANUP_TZ: 'Asia/Tehran',
  MEDIA_ALLOWED_MIME_TYPES: 'image/jpeg,image/png,image/webp,image/gif',
  MEDIA_UPLOAD_RATE_TTL_MS: '60000',
  MEDIA_UPLOAD_RATE_LIMIT: '10',
  ZARINPAL_SANDBOX_URL: 'https://sandbox.zarinpal.com/pg/StartPay',
  ZARINPAL_CALLBACK_URL: '',
  ZIBAL_START_URL: 'https://gateway.zibal.ir/start',
  ZIBAL_CALLBACK_URL: '',
};

@Injectable()
export class ConfigService {
  constructor() {
    const missing = REQUIRED.filter((k) => process.env[k] == null);
    if (missing.length) {
      throw new Error(`Missing env vars: ${missing.join(', ')}`);
    }
    this.assertNotSchemaMigrationMysql();
  }

  /** Server schema MySQL must never be the Nest app database. */
  private assertNotSchemaMigrationMysql() {
    assertAppMysqlTarget(process.env.DB_HOST, process.env.DB_PORT);
  }

  private resolve(key: string): string | undefined {
    if (process.env[key] != null) return process.env[key];
    if (key in DEFAULTS) return DEFAULTS[key];
    return undefined;
  }

  get(key: string): string {
    const v = this.resolve(key);
    if (v == null) throw new Error(`Env var "${key}" is not set`);
    return v;
  }

  getNumber(key: string): number {
    const raw = this.get(key);
    const n = Number(raw);
    if (!Number.isFinite(n)) throw new Error(`Env var "${key}" is not a number (got "${raw}")`);
    return n;
  }

  getNumberOptional(key: string, fallback: number): number {
    const raw = this.resolve(key);
    if (raw == null) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  }

  getBoolean(key: string): boolean {
    const raw = this.get(key).toLowerCase();
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    throw new Error(`Env var "${key}" is not a boolean (got "${raw}")`);
  }

  getBooleanOptional(key: string, fallback: boolean): boolean {
    const raw = this.resolve(key);
    if (raw == null) return fallback;
    const lower = raw.toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
    return fallback;
  }
}
