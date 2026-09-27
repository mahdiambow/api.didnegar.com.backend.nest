import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../../../common/exceptions/api.exception.js';

export const ZIBAL_PAYMENT_STATUSES = {
  '-1': 'PENDING',
  '-2': 'INTERNAL_ERROR',
  '1': 'PAYED_ACCEPTED',
  '2': 'PAYED_NOT_ACCEPTED',
  '3': 'USER_CANCEL',
  '4': 'INVALID_CARD_NUMBER',
  '5': 'INSUFFICIENT_BALANCE',
  '6': 'INVALID_PASSWORD',
  '7': 'REQUESTS_EXCEEDED',
  '8': 'DAILY_PAYMENT_EXCEEDED',
  '9': 'DAILY_PAYMENT_AMOUNT_EXCEEDED',
  '10': 'INVALID_PUBLISHER',
  '11': 'SWITCH_ERROR',
  '12': 'NOT_ACCESSIBLE_CARD',
} as const;

export type ZibalPaymentStatusCode = keyof typeof ZIBAL_PAYMENT_STATUSES;
export type ZibalPaymentStatusName =
  (typeof ZIBAL_PAYMENT_STATUSES)[ZibalPaymentStatusCode];

const STATUS_ERRORS: Partial<
  Record<ZibalPaymentStatusCode, [string, string, HttpStatus]>
> = {
  '-1': [
    'ZIBAL_PAYMENT_PENDING',
    'پرداخت هنوز انجام نشده است',
    HttpStatus.PAYMENT_REQUIRED,
  ],
  '-2': [
    'ZIBAL_INTERNAL_ERROR',
    'خطای داخلی درگاه زیبال',
    HttpStatus.BAD_GATEWAY,
  ],
  '2': [
    'ZIBAL_PAYED_NOT_ACCEPTED',
    'پرداخت انجام شده ولی هنوز تأیید (verify) نشده است',
    HttpStatus.CONFLICT,
  ],
  '3': [
    'ZIBAL_USER_CANCEL',
    'پرداخت توسط کاربر لغو شد',
    HttpStatus.BAD_REQUEST,
  ],
  '4': [
    'ZIBAL_INVALID_CARD_NUMBER',
    'شماره کارت نامعتبر است',
    HttpStatus.BAD_REQUEST,
  ],
  '5': [
    'ZIBAL_INSUFFICIENT_BALANCE',
    'موجودی کارت کافی نیست',
    HttpStatus.PAYMENT_REQUIRED,
  ],
  '6': [
    'ZIBAL_INVALID_PASSWORD',
    'رمز کارت نادرست است',
    HttpStatus.BAD_REQUEST,
  ],
  '7': [
    'ZIBAL_REQUESTS_EXCEEDED',
    'تعداد درخواست‌ها از حد مجاز بیشتر شده است',
    HttpStatus.TOO_MANY_REQUESTS,
  ],
  '8': [
    'ZIBAL_DAILY_PAYMENT_EXCEEDED',
    'تعداد پرداخت روزانه از حد مجاز بیشتر شده است',
    HttpStatus.TOO_MANY_REQUESTS,
  ],
  '9': [
    'ZIBAL_DAILY_PAYMENT_AMOUNT_EXCEEDED',
    'مبلغ پرداخت روزانه از حد مجاز بیشتر شده است',
    HttpStatus.TOO_MANY_REQUESTS,
  ],
  '10': [
    'ZIBAL_INVALID_PUBLISHER',
    'پذیرنده نامعتبر است',
    HttpStatus.BAD_GATEWAY,
  ],
  '11': ['ZIBAL_SWITCH_ERROR', 'خطای سوئیچ بانکی', HttpStatus.BAD_GATEWAY],
  '12': [
    'ZIBAL_NOT_ACCESSIBLE_CARD',
    'کارت قابل دسترسی نیست',
    HttpStatus.BAD_REQUEST,
  ],
};

export function isZibalPaymentAccepted(
  status: number | string | null | undefined,
): boolean {
  return String(status) === '1';
}

export function zibalStatusException(
  status: number | string | null | undefined,
  fallbackMessage?: string,
): ApiException {
  const item =
    status == null
      ? undefined
      : STATUS_ERRORS[String(status) as ZibalPaymentStatusCode];
  if (item) return new ApiException(item[0], item[1], item[2]);
  return new ApiException(
    'ZIBAL_VERIFY_FAILED',
    fallbackMessage ??
      (status != null
        ? `پرداخت زیبال ناموفق بود (status=${status})`
        : 'پرداخت زیبال ناموفق بود'),
    HttpStatus.BAD_REQUEST,
  );
}
