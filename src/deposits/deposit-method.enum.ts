/** روش‌های واریز / پرداخت */
export enum DepositMethod {
  CREDIT = 'credit',
  ZARINPAL = 'zarinpal',
  ZIBAL = 'zibal',
  LOAN = 'loan',
}

/** فقط درگاه بانکی — برای شارژ اعتبار */
export enum BankPaymentMethod {
  ZARINPAL = 'zarinpal',
  ZIBAL = 'zibal',
}

export const DEPOSIT_METHODS = Object.values(DepositMethod);

/** درگاه‌هایی که کال‌بک verify دارند */
export const DEPOSIT_GATEWAY_METHODS = [
  DepositMethod.ZARINPAL,
  DepositMethod.ZIBAL,
  DepositMethod.LOAN,
] as const;

export type DepositGatewayMethod = (typeof DEPOSIT_GATEWAY_METHODS)[number];

export function isDepositGatewayMethod(
  method: DepositMethod,
): method is DepositGatewayMethod {
  return (DEPOSIT_GATEWAY_METHODS as readonly DepositMethod[]).includes(method);
}
