import { ulid } from 'ulid';

/** Crockford Base32 ULID — 26 chars */
export const ULID_LENGTH = 26;
export const ULID_REGEX = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/i;

export const ULID_COLUMN = {
  type: 'varchar' as const,
  length: ULID_LENGTH,
};

export function newId(): string {
  return ulid();
}

export function isUlid(value: unknown): value is string {
  return typeof value === 'string' && ULID_REGEX.test(value);
}
