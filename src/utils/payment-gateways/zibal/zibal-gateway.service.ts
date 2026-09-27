import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ApiException } from '../../../common/exceptions/api.exception.js';
import { ConfigService } from '../../../config/config.service.js';
import type {
  PaymentGateway,
  PaymentInquiryResult,
  PaymentRequestResult,
  PaymentVerifyResult,
} from '../payment-gateway.interface.js';
import {
  isZibalPaymentAccepted,
  zibalStatusException,
} from './zibal-status.js';

type ZibalResponse = {
  result?: number;
  trackId?: number;
  message?: string;
  payLink?: string;
  amount?: number;
  refNumber?: string | number;
  status?: number;
  createdAt?: string;
  paidAt?: string;
  verifiedAt?: string;
  description?: string;
};

/** Stateless adapter for the external Zibal API. It contains no deposit/order logic. */
@Injectable()
export class ZibalGatewayService implements PaymentGateway {
  readonly kind = 'bank' as const;
  readonly gateway = 'iBank' as const;
  private readonly logger = new Logger(ZibalGatewayService.name);
  private readonly merchant: string;
  private readonly apiBase: string;
  private readonly startBaseUrl: string;
  private readonly callbackUrl: string;

  constructor(private readonly config: ConfigService) {
    this.merchant = config.get('ZIBAL_MERCHANT');
    this.apiBase = config.get('ZIBAL_API_BASE').replace(/\/$/, '');
    this.startBaseUrl = config.get('ZIBAL_START_URL').replace(/\/$/, '');
    this.callbackUrl = config.get('ZIBAL_CALLBACK_URL');
  }

  async requestPayment(
    amount: number,
    description: string,
    orderId: string,
    callbackUrl?: string,
  ): Promise<PaymentRequestResult> {
    const resolvedCallback = callbackUrl || this.callbackUrl;
    if (!resolvedCallback)
      throw new ApiException(
        'ZIBAL_CALLBACK_MISSING',
        'ZIBAL_CALLBACK_URL تنظیم نشده است',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    const data = await this.postJson('v1/request', {
      merchant: this.merchant,
      amount: Math.round(amount),
      callbackUrl: resolvedCallback,
      description,
      orderId,
    });
    if (data.result !== 100 || data.trackId == null)
      throw new ApiException(
        'ZIBAL_REQUEST_FAILED',
        data.message ?? `خطای زیبال در درخواست پرداخت (result=${data.result})`,
        HttpStatus.BAD_GATEWAY,
      );
    const trackId = String(data.trackId);
    return {
      trackId,
      paymentUrl: data.payLink || this.buildPaymentUrl(trackId),
      message: data.message ?? 'درخواست پرداخت زیبال ثبت شد',
    };
  }

  async verifyPayment(
    trackId: string,
    expectedAmount: number,
  ): Promise<PaymentVerifyResult> {
    const numericTrackId = Number(trackId);
    if (!Number.isFinite(numericTrackId))
      throw new ApiException(
        'ZIBAL_INVALID_TRACK_ID',
        'trackId زیبال نامعتبر است',
        HttpStatus.BAD_REQUEST,
      );
    const data = await this.postJson('v1/verify', {
      merchant: this.merchant,
      trackId: numericTrackId,
    });
    if (data.result !== 100 && data.result !== 201)
      throw zibalStatusException(
        data.status,
        data.message ?? `تأیید زیبال ناموفق (result=${data.result})`,
      );
    if (
      data.status != null &&
      !isZibalPaymentAccepted(data.status) &&
      data.result !== 201
    )
      throw zibalStatusException(data.status, data.message);
    if (
      data.amount != null &&
      Math.round(data.amount) !== Math.round(expectedAmount)
    )
      throw new ApiException(
        'ZIBAL_AMOUNT_MISMATCH',
        'مبلغ تأییدشده زیبال با مبلغ واریز مطابقت ندارد',
        HttpStatus.CONFLICT,
      );
    return {
      refId: data.refNumber != null ? String(data.refNumber) : trackId,
      message: data.message ?? 'پرداخت زیبال تأیید شد',
      amount: data.amount != null ? Math.round(data.amount) : undefined,
    };
  }

  /** Gateway inquiry is the second stage of the legacy deposit flow. */
  async inquiryPayment(
    trackId: string,
    expectedAmount: number,
  ): Promise<PaymentInquiryResult> {
    const numericTrackId = Number(trackId);
    if (!Number.isFinite(numericTrackId))
      throw new ApiException(
        'ZIBAL_INVALID_TRACK_ID',
        'trackId زیبال نامعتبر است',
        HttpStatus.BAD_REQUEST,
      );
    const data = await this.postJson('v1/inquiry', {
      merchant: this.merchant,
      trackId: numericTrackId,
    });
    if (data.result !== 100)
      throw zibalStatusException(
        data.status,
        data.message ?? `استعلام زیبال ناموفق (result=${data.result})`,
      );
    if (
      data.amount != null &&
      Math.round(data.amount) !== Math.round(expectedAmount)
    )
      throw new ApiException(
        'ZIBAL_AMOUNT_MISMATCH',
        'مبلغ استعلام‌شده زیبال با مبلغ واریز مطابقت ندارد',
        HttpStatus.CONFLICT,
      );
    return {
      accepted: isZibalPaymentAccepted(data.status),
      refId: data.refNumber != null ? String(data.refNumber) : undefined,
      createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
      paidAt: data.paidAt ? new Date(data.paidAt) : undefined,
      verifiedAt: data.verifiedAt ? new Date(data.verifiedAt) : undefined,
      description: data.description,
    };
  }

  buildPaymentUrl(trackId: string): string {
    return `${this.startBaseUrl}/${trackId}`;
  }

  private async postJson(path: string, body: unknown): Promise<ZibalResponse> {
    const url = `${this.apiBase}/${path.replace(/^\//, '')}`;
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (error) {
      this.logger.error(`Zibal network error ${path}`, error);
      throw new ApiException(
        'ZIBAL_NETWORK_ERROR',
        'ارتباط با درگاه زیبال برقرار نشد',
        HttpStatus.BAD_GATEWAY,
      );
    }
    let data: ZibalResponse;
    try {
      data = (await response.json()) as ZibalResponse;
    } catch {
      throw new ApiException(
        'ZIBAL_INVALID_RESPONSE',
        'پاسخ نامعتبر از زیبال',
        HttpStatus.BAD_GATEWAY,
      );
    }
    if (!response.ok)
      throw new ApiException(
        'ZIBAL_HTTP_ERROR',
        `خطای HTTP از زیبال (${response.status})`,
        HttpStatus.BAD_GATEWAY,
      );
    return data;
  }
}
