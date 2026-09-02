import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type {
  PaymentGatewayAdapter,
  PaymentRequestResult,
  PaymentVerifyResult,
} from './payment-gateway.interface.js';

@Injectable()
export class ZarinpalMockService implements PaymentGatewayAdapter {
  readonly gateway = 'zarinpal' as const;

  private readonly sandboxBaseUrl =
    process.env.ZARINPAL_SANDBOX_URL ??
    'https://sandbox.zarinpal.com/pg/StartPay';

  requestPayment(
    amount: number,
    description: string,
    _orderId: string,
  ): PaymentRequestResult {
    const authority = randomBytes(16).toString('hex').slice(0, 36).toUpperCase();

    return {
      authority,
      paymentUrl: this.buildPaymentUrl(authority),
      message: `[MOCK-ZARINPAL] درخواست پرداخت «${description}» با مبلغ ${amount} ریال ثبت شد`,
    };
  }

  verifyPayment(authority: string, amount: number): PaymentVerifyResult {
    const refId = String(
      100000 + (parseInt(authority.slice(0, 6), 16) % 900000),
    );

    return {
      refId,
      message: `[MOCK-ZARINPAL] پرداخت با authority ${authority} به مبلغ ${amount} ریال تأیید شد`,
    };
  }

  buildPaymentUrl(authority: string): string {
    return `${this.sandboxBaseUrl}/${authority}`;
  }
}
