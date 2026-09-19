import { Injectable } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { ConfigService } from '../../config/config.service.js';
import type {
  IBank,
  PaymentRequestResult,
  PaymentVerifyResult,
} from './payment-gateway.interface.js';

@Injectable()
export class ZibalMockService implements IBank {
  readonly kind = 'bank' as const;
  readonly gateway = 'zibal' as const;

  private readonly startBaseUrl: string;

  constructor(config: ConfigService) {
    this.startBaseUrl = config.get('ZIBAL_START_URL');
  }

  requestPayment(
    amount: number,
    description: string,
    orderId: string,
  ): PaymentRequestResult {
    const trackId = String(randomInt(100000000, 999999999));

    return {
      authority: trackId,
      paymentUrl: this.buildPaymentUrl(trackId),
      message: `[MOCK-ZIBAL] درخواست پرداخت «${description}» برای سفارش ${orderId} با مبلغ ${amount} ریال ثبت شد`,
    };
  }

  verifyPayment(authority: string, amount: number): PaymentVerifyResult {
    const refId = String(
      200000 +
        (parseInt(authority.slice(-6), 10) % 800000 || randomInt(1, 99999)),
    );

    return {
      refId,
      message: `[MOCK-ZIBAL] پرداخت با trackId ${authority} به مبلغ ${amount} ریال تأیید شد`,
    };
  }

  buildPaymentUrl(authority: string): string {
    return `${this.startBaseUrl}/${authority}`;
  }
}
