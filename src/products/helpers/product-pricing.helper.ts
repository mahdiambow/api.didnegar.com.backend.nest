export type PriceAdjustmentType = 'percentage' | 'fixed';
export type PriceAdjustmentDirection = 'increase' | 'decrease';
export type PriceApplyTarget = 'minPrice' | 'maxPrice' | 'both';

export function adjustPriceValue(
  current: number | null,
  adjustmentType: PriceAdjustmentType,
  direction: PriceAdjustmentDirection,
  value: number,
): number | null {
  if (current === null) {
    return null;
  }

  let next = Number(current);

  if (adjustmentType === 'percentage') {
    const delta = next * (value / 100);
    next = direction === 'increase' ? next + delta : next - delta;
  } else {
    next = direction === 'increase' ? next + value : next - value;
  }

  return Math.max(0, Math.round(next * 100) / 100);
}

export function applyPriceAdjustment(
  minPrice: number | null,
  maxPrice: number | null,
  adjustmentType: PriceAdjustmentType,
  direction: PriceAdjustmentDirection,
  value: number,
  applyTo: PriceApplyTarget,
): { minPrice: number | null; maxPrice: number | null } {
  let nextMin = minPrice;
  let nextMax = maxPrice;

  if (applyTo === 'minPrice' || applyTo === 'both') {
    nextMin = adjustPriceValue(minPrice, adjustmentType, direction, value);
  }

  if (applyTo === 'maxPrice' || applyTo === 'both') {
    nextMax = adjustPriceValue(maxPrice, adjustmentType, direction, value);
  }

  if (
    nextMin !== null &&
    nextMax !== null &&
    nextMin > nextMax
  ) {
    if (applyTo === 'minPrice') {
      nextMax = nextMin;
    } else if (applyTo === 'maxPrice') {
      nextMin = nextMax;
    } else {
      nextMax = nextMin;
    }
  }

  return { minPrice: nextMin, maxPrice: nextMax };
}

export const PRODUCT_PRICE_EXCEL_HEADERS = [
  'sku',
  'name',
  'minPrice',
  'maxPrice',
] as const;

export type ProductPriceExcelRow = {
  sku: string;
  name: string;
  minPrice: number | null;
  maxPrice: number | null;
};
