import { Injectable } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { ConfigService } from '../../../config/config.service.js';
import type {
  IBank,
  PaymentRequestResult,
  PaymentVerifyResult,
  PaymentInquiryResult,
} from '../payment-gateway.interface.js';

/**
 * In-process Zibal simulator. It is automatically selected for NODE_ENV=stage
 * and can also be enabled explicitly with ZIBAL_USE_MOCK=true.
 */
@Injectable()
export class ZibalMockService implements IBank {
  readonly kind = 'bank' as const;
  readonly gateway = 'iBank' as const;
  private readonly startBaseUrl: string;

  constructor(config: ConfigService) {
    this.startBaseUrl = config.get('ZIBAL_START_URL').replace(/\/$/, '');
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

  inquiryPayment(trackId: string, _amount: number): PaymentInquiryResult {
    return { accepted: true, refId: `MOCK-${trackId}`, verifiedAt: new Date() };
  }

  buildPaymentUrl(trackId: string): string {
    return `${this.startBaseUrl}/${trackId}`;
  }
}
