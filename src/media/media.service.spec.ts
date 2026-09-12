import { describe, expect, it } from 'vitest';
import { ApiException } from '../common/exceptions/api.exception.js';
import type { AuthUser } from '../auth/types/auth-user.type.js';
import { assertMediaAccess, canBrowseAllMedia } from './media.service.js';

const seller = (overrides: Partial<AuthUser> = {}): AuthUser => ({
  sub: 'u1',
  role: 'seller',
  roles: ['seller'],
  sellerId: 'seller-a',
  ...overrides,
});

describe('media access', () => {
  it('lets super-seller browse all', () => {
    expect(
      canBrowseAllMedia(
        seller({ role: 'super-seller', roles: ['super-seller'] }),
      ),
    ).toBe(true);
  });

  it('allows a seller only their own gallery', () => {
    expect(() => assertMediaAccess(seller(), 'seller-a')).not.toThrow();
    expect(() => assertMediaAccess(seller(), 'seller-b')).toThrow(ApiException);
  });
});
