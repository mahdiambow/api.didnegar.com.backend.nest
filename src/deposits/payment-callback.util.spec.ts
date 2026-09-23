import { describe, expect, it } from 'vitest';
import {
  buildFrontendPaymentCallbackUrl,
  buildPaymentCallbackUrl,
  toZibalPaymentStatusName,
} from './payment-callback.util.js';

describe('buildPaymentCallbackUrl', () => {
  it('appends sourceType and sourceId as query params', () => {
    expect(
      buildPaymentCallbackUrl(
        'http://localhost:3000/deposits/callback/zibal',
        'ORDER_PAYMENT',
        '01ORDER',
      ),
    ).toBe(
      'http://localhost:3000/deposits/callback/zibal?sourceType=ORDER_PAYMENT&sourceId=01ORDER',
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

describe('toZibalPaymentStatusName', () => {
  it('maps numeric codes to string names', () => {
    expect(toZibalPaymentStatusName(1)).toBe('PAYED_ACCEPTED');
    expect(toZibalPaymentStatusName('3')).toBe('USER_CANCEL');
    expect(toZibalPaymentStatusName(-1)).toBe('PENDING');
  });

  it('handles unknown / empty status', () => {
    expect(toZibalPaymentStatusName(99)).toBe('UNKNOWN_99');
    expect(toZibalPaymentStatusName(null)).toBe('UNKNOWN');
  });
});

describe('buildFrontendPaymentCallbackUrl', () => {
  it('sets status as string name not number', () => {
    expect(
      buildFrontendPaymentCallbackUrl('http://localhost:3001/payment/callback', {
        status: 1,
        trackId: '123',
        success: 1,
        sourceType: 'ORDER_PAYMENT',
        sourceId: '01ORDER',
      }),
    ).toBe(
      'http://localhost:3001/payment/callback?status=PAYED_ACCEPTED&trackId=123&success=1&sourceType=ORDER_PAYMENT&sourceId=01ORDER',
    );
  });
});
