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
    const authority = `LOAN-${randomBytes(12).toString('hex').toUpperCase()}`;
    return {
      authority,
      paymentUrl: this.buildPaymentUrl(authority),
      message: `[MOCK-LOAN] درخواست وام «${description}» با مبلغ ${amount} ریال ثبت شد`,
    };
  }

  verifyPayment(
    authority: string,
    amount: number,
  ): PaymentExternalVerifyResult {
    const refId = `LN-${authority.slice(-8)}`;
    return {
      refId,
      message: `[MOCK-LOAN] پرداخت وام ${authority} به مبلغ ${amount} ریال تأیید شد`,
    };
  }

  buildPaymentUrl(authority: string): string {
    return `${this.startUrl}/${authority}`;
  }
}
