import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { ConfigService } from '../../../config/config.service.js';
import type {
  ILoan,
  PaymentExternalRequestResult,
  PaymentExternalVerifyResult,
} from '../payment-gateway.interface.js';

/** Development-only adapter until the real loan provider is integrated. */
@Injectable()
export class LoanMockService implements ILoan {
  readonly kind = 'loan' as const;
  readonly gateway = 'loan' as const;
  private readonly startUrl: string;

  constructor(config: ConfigService) {
    this.startUrl = config.get('LOAN_START_URL');
  }

  requestPayment(amount: number, description: string): PaymentExternalRequestResult {
    const trackId = `LOAN-${randomBytes(12).toString('hex').toUpperCase()}`;
    return {
      trackId,
      paymentUrl: this.buildPaymentUrl(trackId),
      message: `[MOCK-LOAN] درخواست وام «${description}» با مبلغ ${amount} ریال ثبت شد`,
    };
  }

  verifyPayment(trackId: string, amount: number): PaymentExternalVerifyResult {
    return { refId: `LN-${trackId.slice(-8)}`, message: `[MOCK-LOAN] پرداخت وام ${trackId} به مبلغ ${amount} ریال تأیید شد`, amount };
  }

  buildPaymentUrl(trackId: string): string {
    return `${this.startUrl}/${trackId}`;
  }
}
