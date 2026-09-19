import 'reflect-metadata';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZibalService } from './zibal.service.js';
import type { ConfigService } from '../../config/config.service.js';

function mockConfig(overrides: Record<string, string> = {}): ConfigService {
  const values: Record<string, string> = {
    ZIBAL_MERCHANT: 'zibal',
    ZIBAL_API_BASE: 'https://gateway.zibal.ir',
    ZIBAL_START_URL: 'https://gateway.zibal.ir/start',
    ZIBAL_CALLBACK_URL: 'https://api.example.com/deposits/zibal/verify',
    ...overrides,
  };
  return {
    get: (key: string) => {
      if (values[key] == null) throw new Error(`missing ${key}`);
      return values[key];
    },
  } as ConfigService;
}

describe('ZibalService (IPG verify)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('requestPayment posts /v1/request and returns trackId + start URL', async () => {
    globalThis.fetch = vi.fn(async () =>
      Response.json({
        result: 100,
        trackId: 987654321,
        message: 'success',
      }),
    ) as typeof fetch;

    const service = new ZibalService(mockConfig());
    const result = await service.requestPayment(15000, 'test order', '01ORDER');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://gateway.zibal.ir/v1/request',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          merchant: 'zibal',
          amount: 15000,
          callbackUrl: 'https://api.example.com/deposits/zibal/verify',
          description: 'test order',
          orderId: '01ORDER',
        }),
      }),
    );
    expect(result.trackId).toBe('987654321');
    expect(result.paymentUrl).toBe('https://gateway.zibal.ir/start/987654321');
  });

  it('verifyPayment accepts result 100 and returns refNumber', async () => {
    globalThis.fetch = vi.fn(async () =>
      Response.json({
        result: 100,
        message: 'success',
        amount: 15000,
        refNumber: 555666777,
        status: 1,
      }),
    ) as typeof fetch;

    const service = new ZibalService(mockConfig());
    const result = await service.verifyPayment('987654321', 15000);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://gateway.zibal.ir/v1/verify',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          merchant: 'zibal',
          trackId: 987654321,
        }),
      }),
    );
    expect(result.refId).toBe('555666777');
    expect(result.amount).toBe(15000);
  });

  it('verifyPayment accepts result 201 (already verified)', async () => {
    globalThis.fetch = vi.fn(async () =>
      Response.json({
        result: 201,
        message: 'already verified',
        amount: 15000,
        refNumber: 'REF-201',
      }),
    ) as typeof fetch;

    const service = new ZibalService(mockConfig());
    const result = await service.verifyPayment('111', 15000);
    expect(result.refId).toBe('REF-201');
  });

  it('verifyPayment rejects non-100/201 result', async () => {
    globalThis.fetch = vi.fn(async () =>
      Response.json({
        result: 202,
        message: 'payment failed',
      }),
    ) as typeof fetch;

    const service = new ZibalService(mockConfig());
    await expect(service.verifyPayment('111', 15000)).rejects.toMatchObject({
      response: { code: 'ZIBAL_VERIFY_FAILED' },
    });
  });

  it('verifyPayment rejects amount mismatch', async () => {
    globalThis.fetch = vi.fn(async () =>
      Response.json({
        result: 100,
        amount: 9999,
        refNumber: 1,
        message: 'success',
      }),
    ) as typeof fetch;

    const service = new ZibalService(mockConfig());
    await expect(service.verifyPayment('111', 15000)).rejects.toMatchObject({
      response: { code: 'ZIBAL_AMOUNT_MISMATCH' },
    });
  });

  it('verifyPayment rejects unpaid track (result 203 style)', async () => {
    globalThis.fetch = vi.fn(async () =>
      Response.json({
        result: 203,
        message: 'trackId not found / unpaid',
      }),
    ) as typeof fetch;

    const service = new ZibalService(mockConfig());
    await expect(service.verifyPayment('999', 1000)).rejects.toMatchObject({
      response: { code: 'ZIBAL_VERIFY_FAILED' },
    });
  });
});
