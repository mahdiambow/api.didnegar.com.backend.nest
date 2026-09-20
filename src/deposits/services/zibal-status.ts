import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../../common/exceptions/api.exception.js';

/**
 * وضعیت تراکنش زیبال (فیلد status در callback / inquiry / verify)
 * @see https://help.zibal.ir/ipg/
 */
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

type ZibalStatusMeta = {
  name: ZibalPaymentStatusName;
  code: string;
  message: string;
  httpStatus: HttpStatus;
};

const ZIBAL_STATUS_META: Record<ZibalPaymentStatusCode, ZibalStatusMeta> = {
  '-1': {
    name: 'PENDING',
    code: 'ZIBAL_PAYMENT_PENDING',
    message: 'پرداخت هنوز انجام نشده است',
    httpStatus: HttpStatus.PAYMENT_REQUIRED,
  },
  '-2': {
    name: 'INTERNAL_ERROR',
    code: 'ZIBAL_INTERNAL_ERROR',
    message: 'خطای داخلی درگاه زیبال',
    httpStatus: HttpStatus.BAD_GATEWAY,
  },
  '1': {
    name: 'PAYED_ACCEPTED',
    code: 'ZIBAL_PAYED_ACCEPTED',
    message: 'پرداخت موفق و تأیید شده است',
    httpStatus: HttpStatus.OK,
  },
  '2': {
    name: 'PAYED_NOT_ACCEPTED',
    code: 'ZIBAL_PAYED_NOT_ACCEPTED',
    message: 'پرداخت انجام شده ولی هنوز تأیید (verify) نشده است',
    httpStatus: HttpStatus.CONFLICT,
  },
  '3': {
    name: 'USER_CANCEL',
    code: 'ZIBAL_USER_CANCEL',
    message: 'پرداخت توسط کاربر لغو شد',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  '4': {
    name: 'INVALID_CARD_NUMBER',
    code: 'ZIBAL_INVALID_CARD_NUMBER',
    message: 'شماره کارت نامعتبر است',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  '5': {
    name: 'INSUFFICIENT_BALANCE',
    code: 'ZIBAL_INSUFFICIENT_BALANCE',
    message: 'موجودی کارت کافی نیست',
    httpStatus: HttpStatus.PAYMENT_REQUIRED,
  },
  '6': {
    name: 'INVALID_PASSWORD',
    code: 'ZIBAL_INVALID_PASSWORD',
    message: 'رمز کارت نادرست است',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  '7': {
    name: 'REQUESTS_EXCEEDED',
    code: 'ZIBAL_REQUESTS_EXCEEDED',
    message: 'تعداد درخواست‌ها از حد مجاز بیشتر شده است',
    httpStatus: HttpStatus.TOO_MANY_REQUESTS,
  },
  '8': {
    name: 'DAILY_PAYMENT_EXCEEDED',
    code: 'ZIBAL_DAILY_PAYMENT_EXCEEDED',
    message: 'تعداد پرداخت روزانه از حد مجاز بیشتر شده است',
    httpStatus: HttpStatus.TOO_MANY_REQUESTS,
  },
  '9': {
    name: 'DAILY_PAYMENT_AMOUNT_EXCEEDED',
    code: 'ZIBAL_DAILY_PAYMENT_AMOUNT_EXCEEDED',
    message: 'مبلغ پرداخت روزانه از حد مجاز بیشتر شده است',
    httpStatus: HttpStatus.TOO_MANY_REQUESTS,
  },
  '10': {
    name: 'INVALID_PUBLISHER',
    code: 'ZIBAL_INVALID_PUBLISHER',
    message: 'پذیرنده نامعتبر است',
    httpStatus: HttpStatus.BAD_GATEWAY,
  },
  '11': {
    name: 'SWITCH_ERROR',
    code: 'ZIBAL_SWITCH_ERROR',
    message: 'خطای سوئیچ بانکی',
    httpStatus: HttpStatus.BAD_GATEWAY,
  },
  '12': {
    name: 'NOT_ACCESSIBLE_CARD',
    code: 'ZIBAL_NOT_ACCESSIBLE_CARD',
    message: 'کارت قابل دسترسی نیست',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
};

export function getZibalStatusMeta(
  status: number | string | null | undefined,
): ZibalStatusMeta | null {
  if (status == null || status === '') return null;
  const key = String(status) as ZibalPaymentStatusCode;
  return ZIBAL_STATUS_META[key] ?? null;
}

export function isZibalPaymentAccepted(
  status: number | string | null | undefined,
): boolean {
  return String(status) === '1';
}

/** برای status ناموفق (یا ناشناخته) ApiException مناسب برمی‌گرداند */
export function zibalStatusException(
  status: number | string | null | undefined,
  fallbackMessage?: string,
): ApiException {
  const meta = getZibalStatusMeta(status);
  if (meta && meta.name !== 'PAYED_ACCEPTED') {
    return new ApiException(meta.code, meta.message, meta.httpStatus);
  }
  return new ApiException(
    'ZIBAL_VERIFY_FAILED',
    fallbackMessage ??
      (status != null
        ? `پرداخت زیبال ناموفق بود (status=${status})`
        : 'پرداخت زیبال ناموفق بود'),
    HttpStatus.BAD_REQUEST,
  );
}
