import { Injectable } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { ConfigService } from '../../config/config.service.js';
import type {
  IBank,
  PaymentRequestResult,
  PaymentVerifyResult,
} from './deposit-gateway.interface.js';

/** فقط وقتی ZIBAL_USE_MOCK=true — در غیر این صورت از ZibalService واقعی استفاده شود */
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
      trackId,
      paymentUrl: this.buildPaymentUrl(trackId),
      message: `[MOCK-ZIBAL] درخواست پرداخت «${description}» برای سفارش ${orderId} با مبلغ ${amount} ریال ثبت شد`,
    };
  }

  verifyPayment(trackId: string, amount: number): PaymentVerifyResult {
    const refId = String(
      200000 +
        (parseInt(trackId.slice(-6), 10) % 800000 || randomInt(1, 99999)),
    );

    return {
      refId,
      message: `[MOCK-ZIBAL] پرداخت با trackId ${trackId} به مبلغ ${amount} ریال تأیید شد`,
      amount,
    };
  }

  buildPaymentUrl(trackId: string): string {
    return `${this.startBaseUrl}/${trackId}`;
  }
}
