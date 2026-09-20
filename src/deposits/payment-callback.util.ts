import type { TransactionSourceType } from '../transactions/entities/transaction.types.js';

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
