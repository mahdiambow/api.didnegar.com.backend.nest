import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../../config/config.service.js';
import { ApiException } from '../../common/exceptions/api.exception.js';
import type {
  IBank,
  PaymentRequestResult,
  PaymentVerifyResult,
} from './deposit-gateway.interface.js';
import {
  isZibalPaymentAccepted,
  zibalStatusException,
} from './zibal-status.js';

type ZibalRequestResponse = {
  result?: number;
  trackId?: number;
  message?: string;
  payLink?: string;
};

type ZibalVerifyResponse = {
  result?: number;
  message?: string;
  amount?: number;
  refNumber?: string | number;
  status?: number;
  orderId?: string;
  cardNumber?: string;
  paidAt?: string;
};

/**
 * زیبال IPG — مطابق https://help.zibal.ir/ipg/
 * - request: POST /v1/request
 * - start:   GET  /start/{trackId}
 * - verify:  POST /v1/verify  { merchant, trackId }
 * - result 100 = موفق | 201 = قبلاً verify شده
 * - status تراکنش: ۱ = پرداخت‌شده و تأییدشده (بقیه → خطا)
 */
@Injectable()
export class ZibalService implements IBank {
  readonly kind = 'bank' as const;
  readonly gateway = 'iBank' as const;

  private readonly logger = new Logger(ZibalService.name);
  private readonly merchant: string;
  private readonly apiBase: string;
  private readonly startBaseUrl: string;
  private readonly callbackUrl: string;

  constructor(private readonly config: ConfigService) {
    this.merchant = this.config.get('ZIBAL_MERCHANT');
    this.apiBase = this.config.get('ZIBAL_API_BASE').replace(/\/$/, '');
    this.startBaseUrl = this.config.get('ZIBAL_START_URL').replace(/\/$/, '');
    this.callbackUrl = this.config.get('ZIBAL_CALLBACK_URL');
  }

  async requestPayment(
    amount: number,
    description: string,
    orderId: string,
    callbackUrl?: string,
  ): Promise<PaymentRequestResult> {
    const resolvedCallback = callbackUrl || this.callbackUrl;
    if (!resolvedCallback) {
      throw new ApiException(
        'ZIBAL_CALLBACK_MISSING',
        'ZIBAL_CALLBACK_URL تنظیم نشده است',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const body = {
      merchant: this.merchant,
      amount: Math.round(amount),
      callbackUrl: resolvedCallback,
      description,
      orderId,
    };

    this.logger.log(
      `Zibal request merchant=${this.merchant} amount=${body.amount} orderId=${orderId}`,
    );

    const data = await this.postJson<ZibalRequestResponse>('v1/request', body);

    if (data.result !== 100 || data.trackId == null) {
      throw new ApiException(
        'ZIBAL_REQUEST_FAILED',
        data.message ?? `خطای زیبال در درخواست پرداخت (result=${data.result})`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const trackId = String(data.trackId);
    return {
      trackId,
      paymentUrl: data.payLink || this.buildPaymentUrl(trackId),
      message: data.message ?? 'درخواست پرداخت زیبال ثبت شد',
    };
  }

  /**
   * تأیید پرداخت — POST /v1/verify
   * فقط result=100 یا 201 پذیرفته می‌شود؛ مبلغ پاسخ با مبلغ سفارش تطبیق داده می‌شود.
   */
  async verifyPayment(
    trackId: string,
    expectedAmount: number,
  ): Promise<PaymentVerifyResult> {
    const numericTrackId = Number(trackId);
    if (!Number.isFinite(numericTrackId)) {
      throw new ApiException(
        'ZIBAL_INVALID_TRACK_ID',
        'trackId زیبال نامعتبر است',
        HttpStatus.BAD_REQUEST,
      );
    }

    const data = await this.postJson<ZibalVerifyResponse>('v1/verify', {
      merchant: this.merchant,
      trackId: numericTrackId,
    });

    // 100 = موفق، 201 = قبلاً تأیید شده (idempotent)
    if (data.result !== 100 && data.result !== 201) {
      this.logger.warn(
        `Zibal verify failed trackId=${trackId} result=${data.result} status=${data.status}`,
      );
      throw zibalStatusException(
        data.status,
        data.message ?? `تأیید زیبال ناموفق (result=${data.result})`,
      );
    }

    if (
      data.status != null &&
      !isZibalPaymentAccepted(data.status) &&
      data.result !== 201
    ) {
      this.logger.warn(
        `Zibal verify status not accepted trackId=${trackId} status=${data.status}`,
      );
      throw zibalStatusException(data.status, data.message);
    }

    if (
      data.amount != null &&
      Math.round(data.amount) !== Math.round(expectedAmount)
    ) {
      this.logger.warn(
        `Zibal amount mismatch trackId=${trackId} expected=${expectedAmount} got=${data.amount}`,
      );
      throw new ApiException(
        'ZIBAL_AMOUNT_MISMATCH',
        'مبلغ تأییدشده زیبال با مبلغ واریز مطابقت ندارد',
        HttpStatus.CONFLICT,
      );
    }

    return {
      refId: data.refNumber != null ? String(data.refNumber) : trackId,
      message: data.message ?? 'پرداخت زیبال تأیید شد',
      amount: data.amount != null ? Math.round(data.amount) : undefined,
    };
  }

  buildPaymentUrl(trackId: string): string {
    return `${this.startBaseUrl}/${trackId}`;
  }

  private async postJson<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.apiBase}/${path.replace(/^\//, '')}`;
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (err) {
      this.logger.error(`Zibal network error ${path}`, err);
      throw new ApiException(
        'ZIBAL_NETWORK_ERROR',
        'ارتباط با درگاه زیبال برقرار نشد',
        HttpStatus.BAD_GATEWAY,
      );
    }

    let data: T;
    try {
      data = (await response.json()) as T;
    } catch {
      throw new ApiException(
        'ZIBAL_INVALID_RESPONSE',
        'پاسخ نامعتبر از زیبال',
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (!response.ok) {
      this.logger.warn(`Zibal HTTP ${response.status} on ${path}`);
      throw new ApiException(
        'ZIBAL_HTTP_ERROR',
        `خطای HTTP از زیبال (${response.status})`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    return data;
  }
}
