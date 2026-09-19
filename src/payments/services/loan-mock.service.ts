import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { ConfigService } from '../../config/config.service.js';
import type {
  ILoan,
  PaymentExternalRequestResult,
  PaymentExternalVerifyResult,
} from './payment-gateway.interface.js';

@Injectable()
export class LoanMockService implements ILoan {
  readonly kind = 'loan' as const;
  readonly gateway = 'loan' as const;

  private readonly startUrl: string;

  constructor(config: ConfigService) {
    this.startUrl = config.get('LOAN_START_URL');
  }

  requestPayment(
    amount: number,
    description: string,
    _orderId: string,
  ): PaymentExternalRequestResult {
    const trackId = `LOAN-${randomBytes(12).toString('hex').toUpperCase()}`;
    return {
      trackId,
      paymentUrl: this.buildPaymentUrl(trackId),
      message: `[MOCK-LOAN] درخواست وام «${description}» با مبلغ ${amount} ریال ثبت شد`,
    };
  }

  verifyPayment(
    trackId: string,
    amount: number,
  ): PaymentExternalVerifyResult {
    const refId = `LN-${trackId.slice(-8)}`;
    return {
      refId,
      message: `[MOCK-LOAN] پرداخت وام ${trackId} به مبلغ ${amount} ریال تأیید شد`,
    };
  }

  buildPaymentUrl(trackId: string): string {
    return `${this.startUrl}/${trackId}`;
  }
}
