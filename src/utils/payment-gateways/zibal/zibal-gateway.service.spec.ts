import 'reflect-metadata';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConfigService } from '../../../config/config.service.js';
import { ZibalGatewayService } from './zibal-gateway.service.js';

function mockConfig(): ConfigService {
  const values: Record<string, string> = {
    ZIBAL_MERCHANT: 'zibal',
    ZIBAL_API_BASE: 'https://gateway.zibal.ir',
    ZIBAL_START_URL: 'https://gateway.zibal.ir/start',
    ZIBAL_CALLBACK_URL: 'https://frontend.example.com/payment/callback',
  };
  return { get: (key: string) => values[key] } as ConfigService;
}

describe('ZibalGatewayService', () => {
  const originalFetch = globalThis.fetch;
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => { globalThis.fetch = originalFetch; });

  it('creates a payment through Zibal', async () => {
    globalThis.fetch = vi.fn(async () => Response.json({ result: 100, trackId: 987654321 })) as typeof fetch;
    const result = await new ZibalGatewayService(mockConfig()).requestPayment(15000, 'test order', '01ORDER');
    expect(globalThis.fetch).toHaveBeenCalledWith('https://gateway.zibal.ir/v1/request', expect.objectContaining({ method: 'POST' }));
    expect(result).toMatchObject({ trackId: '987654321', paymentUrl: 'https://gateway.zibal.ir/start/987654321' });
  });

  it('verifies a paid track and returns the reference number', async () => {
    globalThis.fetch = vi.fn(async () => Response.json({ result: 100, amount: 15000, refNumber: 555666777, status: 1 })) as typeof fetch;
    await expect(new ZibalGatewayService(mockConfig()).verifyPayment('987654321', 15000)).resolves.toMatchObject({ refId: '555666777', amount: 15000 });
  });

  it('accepts Zibal result 201 for an already verified payment', async () => {
    globalThis.fetch = vi.fn(async () => Response.json({ result: 201, amount: 15000, refNumber: 'REF-201' })) as typeof fetch;
    await expect(new ZibalGatewayService(mockConfig()).verifyPayment('111', 15000)).resolves.toMatchObject({ refId: 'REF-201' });
  });

  it('maps a Zibal cancellation to a typed error', async () => {
    globalThis.fetch = vi.fn(async () => Response.json({ result: 202, status: 3 })) as typeof fetch;
    await expect(new ZibalGatewayService(mockConfig()).verifyPayment('111', 15000)).rejects.toMatchObject({ response: { code: 'ZIBAL_USER_CANCEL' } });
  });

  it('rejects a verified amount that differs from the expected amount', async () => {
    globalThis.fetch = vi.fn(async () => Response.json({ result: 100, amount: 9999, refNumber: 1, status: 1 })) as typeof fetch;
    await expect(new ZibalGatewayService(mockConfig()).verifyPayment('111', 15000)).rejects.toMatchObject({ response: { code: 'ZIBAL_AMOUNT_MISMATCH' } });
  });
});
