import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ApiException } from '../../common/exceptions/api.exception.js';
import { ConfigService } from '../../config/config.service.js';

/**
 * ارسال OTP از طریق پنل کاوه‌نگار (verify/lookup).
 * @see https://kavenegar.com/rest.html#verify-lookup
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly config: ConfigService) {}

  /** ارسال کد OTP به موبایل با قالب verifydidnegar */
  async sendOtp(mobile: string, otp: string): Promise<void> {
    const apiKey = this.config.get('KAVENEGAR_API_KEY').trim();
    const template = this.config.get('KAVENEGAR_OTP_TEMPLATE').trim();
    const base = this.config
      .get('KAVENEGAR_API_BASE')
      .replace(/\/$/, '');

    if (!apiKey) {
      throw new ApiException(
        'SMS_NOT_CONFIGURED',
        'سرویس پیامک پیکربندی نشده است',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const receptor = this.normalizeMobile(mobile);
    const url = new URL(`${base}/${apiKey}/verify/lookup.json`);
    url.searchParams.set('receptor', receptor);
    url.searchParams.set('token', otp);
    url.searchParams.set('template', template);

    let response: Response;
    try {
      response = await fetch(url.toString(), { method: 'GET' });
    } catch (err) {
      this.logger.error(`Kavenegar network error for ${receptor}`, err);
      throw new ApiException(
        'SMS_SEND_FAILED',
        'ارسال پیامک ناموفق بود',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const body = (await response.json().catch(() => null)) as {
      return?: { status?: number; message?: string };
    } | null;

    const status = body?.return?.status;
    // 200 = موفقیت طبق مستندات کاوه‌نگار
    if (!response.ok || status !== 200) {
      this.logger.warn(
        `Kavenegar OTP failed receptor=${receptor} http=${response.status} status=${status} msg=${body?.return?.message ?? ''}`,
      );
      throw new ApiException(
        'SMS_SEND_FAILED',
        body?.return?.message || 'ارسال پیامک ناموفق بود',
        HttpStatus.BAD_GATEWAY,
      );
    }

    this.logger.log(`OTP SMS sent to ${receptor}`);
  }

  private normalizeMobile(mobile: string): string {
    const digits = mobile.replace(/\D/g, '');
    if (digits.startsWith('98') && digits.length >= 12) {
      return `0${digits.slice(2)}`;
    }
    if (digits.startsWith('9') && digits.length === 10) {
      return `0${digits}`;
    }
    return digits;
  }
}
