import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
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
    this.sandboxBaseUrl = config
      .get('ZARINPAL_SANDBOX_URL')
      .replace(/\/$/, '');
  }

  requestPayment(
    amount: number,
    description: string,
    _orderId: string,
  ): PaymentRequestResult {
    // زرین‌پال: Authority باید دقیقاً ۳۶ کاراکتر باشد (UUID)
    const trackId = randomUUID().toUpperCase();

    return {
      trackId,
      paymentUrl: this.buildPaymentUrl(trackId),
      message: `[MOCK-ZARINPAL] درخواست پرداخت «${description}» با مبلغ ${amount} ریال ثبت شد`,
    };
  }

  verifyPayment(trackId: string, amount: number): PaymentVerifyResult {
    const hex = trackId.replace(/-/g, '').slice(0, 6);
    const refId = String(100000 + (parseInt(hex, 16) % 900000 || 1));

    return {
      refId,
      message: `[MOCK-ZARINPAL] پرداخت با trackId ${trackId} به مبلغ ${amount} ریال تأیید شد`,
      amount,
    };
  }

  /** آدرس درگاه sandbox — کال‌بک جداگانه با ZARINPAL_CALLBACK_URL است */
  buildPaymentUrl(trackId: string): string {
    return `${this.sandboxBaseUrl}/${trackId}`;
  }
}
