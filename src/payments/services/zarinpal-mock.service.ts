import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';

export interface ZarinpalRequestResult {
  authority: string;
  paymentUrl: string;
  fee: number;
  feeType: 'Merchant';
  code: 100;
  message: string;
}

export interface ZarinpalVerifyResult {
  refId: string;
  cardPan: string;
  fee: number;
  code: 100;
  message: string;
}

@Injectable()
export class ZarinpalMockService {
  private readonly sandboxBaseUrl =
    process.env.ZARINPAL_SANDBOX_URL ??
    'https://sandbox.zarinpal.com/pg/StartPay';

  requestPayment(amount: number, description: string): ZarinpalRequestResult {
    const authority = randomBytes(16).toString('hex').slice(0, 36).toUpperCase();

    return {
      authority,
      paymentUrl: `${this.sandboxBaseUrl}/${authority}`,
      fee: Math.round(amount * 0.01),
      feeType: 'Merchant',
      code: 100,
      message: `[MOCK] درخواست پرداخت «${description}» با مبلغ ${amount} ریال ثبت شد`,
    };
  }

  verifyPayment(authority: string, amount: number): ZarinpalVerifyResult {
    const refId = String(
      100000 + (parseInt(authority.slice(0, 6), 16) % 900000),
    );

    return {
      refId,
      cardPan: '5022-29**-****-1234',
      fee: Math.round(amount * 0.01),
      code: 100,
      message: `[MOCK] پرداخت با authority ${authority} تأیید شد`,
    };
  }
}
