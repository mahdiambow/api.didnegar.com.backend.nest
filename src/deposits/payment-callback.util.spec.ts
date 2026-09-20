import { describe, expect, it } from 'vitest';
import { buildPaymentCallbackUrl } from './payment-callback.util.js';

describe('buildPaymentCallbackUrl', () => {
  it('appends sourceType and sourceId as query params', () => {
    expect(
      buildPaymentCallbackUrl(
        'http://localhost:3001/payment/callback',
        'ORDER_PAYMENT',
        '01ORDER',
      ),
    ).toBe(
      'http://localhost:3001/payment/callback?sourceType=ORDER_PAYMENT&sourceId=01ORDER',
    );
  });

  it('preserves existing query and merges params', () => {
    expect(
      buildPaymentCallbackUrl(
        'http://localhost:3001/payment/callback?foo=1',
        'DEPOSIT',
        '01DEP',
      ),
    ).toBe(
      'http://localhost:3001/payment/callback?foo=1&sourceType=DEPOSIT&sourceId=01DEP',
    );
  });
});
