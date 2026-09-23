import type { TransactionSourceType } from '../transactions/entities/transaction.types.js';
import {
  ZIBAL_PAYMENT_STATUSES,
  type ZibalPaymentStatusCode,
} from './services/zibal-status.js';

/** کال‌بک درگاه + queryهای اپ: sourceType و sourceId */
export function buildPaymentCallbackUrl(
  baseUrl: string,
  sourceType: TransactionSourceType,
  sourceId: string,
): string {
  const url = new URL(baseUrl);
  url.searchParams.set('sourceType', sourceType);
  url.searchParams.set('sourceId', sourceId);
  return url.toString();
}

/** عدد status زیبال → استرینگ (مثل PAYED_ACCEPTED) */
export function toZibalPaymentStatusName(
  status: number | string | null | undefined,
): string {
  if (status == null || status === '') return 'UNKNOWN';
  const key = String(status) as ZibalPaymentStatusCode;
  return ZIBAL_PAYMENT_STATUSES[key] ?? `UNKNOWN_${key}`;
}

/** ریدایرکت فرانت بعد از کال‌بک درگاه — status همیشه استرینگ است */
export function buildFrontendPaymentCallbackUrl(
  frontendBaseUrl: string,
  params: {
    status: number | string | null | undefined;
    trackId?: string | null;
    success?: string | number | null;
    sourceType?: string | null;
    sourceId?: string | null;
  },
): string {
  const url = new URL(frontendBaseUrl);
  url.searchParams.set('status', toZibalPaymentStatusName(params.status));
  if (params.trackId != null && params.trackId !== '') {
    url.searchParams.set('trackId', String(params.trackId));
  }
  if (params.success != null && params.success !== '') {
    url.searchParams.set('success', String(params.success));
  }
  if (params.sourceType) {
    url.searchParams.set('sourceType', params.sourceType);
  }
  if (params.sourceId) {
    url.searchParams.set('sourceId', params.sourceId);
  }
  return url.toString();
}
