import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { ConfigService } from '../../config/config.service.js';
import type {
  IBank,
  PaymentRequestResult,
  PaymentVerifyResult,
} from './deposit-gateway.interface.js';

@Injectable()
export class ZarinpalMockService implements IBank {
  readonly kind = 'bank' as const;
  readonly gateway = 'zarinpal' as const;

  private readonly sandboxBaseUrl: string;

  constructor(config: ConfigService) {
    this.sandboxBaseUrl = config.get('ZARINPAL_SANDBOX_URL');
  }

  requestPayment(
    amount: number,
    description: string,
    _orderId: string,
  ): PaymentRequestResult {
    const trackId = randomBytes(16).toString('hex').slice(0, 36).toUpperCase();

    return {
      trackId,
      paymentUrl: this.buildPaymentUrl(trackId),
      message: `[MOCK-ZARINPAL] درخواست پرداخت «${description}» با مبلغ ${amount} ریال ثبت شد`,
    };
  }

  verifyPayment(trackId: string, amount: number): PaymentVerifyResult {
    const refId = String(
      100000 + (parseInt(trackId.slice(0, 6), 16) % 900000),
    );

    return {
      refId,
      message: `[MOCK-ZARINPAL] پرداخت با trackId ${trackId} به مبلغ ${amount} ریال تأیید شد`,
    };
  }

  buildPaymentUrl(trackId: string): string {
    return `${this.sandboxBaseUrl}/${trackId}`;
  }
}
