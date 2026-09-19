/** درگاه بانکی (زرین‌پال، زیبال، …) */
export interface IBank {
  readonly kind: 'bank';
  readonly gateway: 'zarinpal' | 'zibal';
  requestPayment(
    amount: number,
    description: string,
    orderId: string,
  ): PaymentExternalRequestResult;
  verifyPayment(authority: string, amount: number): PaymentExternalVerifyResult;
  buildPaymentUrl(authority: string): string;
}

/** وام / اقساط شخص ثالث */
export interface ILoan {
  readonly kind: 'loan';
  readonly gateway: 'loan';
  requestPayment(
    amount: number,
    description: string,
    orderId: string,
  ): PaymentExternalRequestResult;
  verifyPayment(authority: string, amount: number): PaymentExternalVerifyResult;
  buildPaymentUrl(authority: string): string;
}

export type ExternalPaymentProvider = IBank | ILoan;

export interface PaymentExternalRequestResult {
  authority: string;
  paymentUrl: string;
  message: string;
}

export interface PaymentExternalVerifyResult {
  refId: string;
  message: string;
}

/** سازگاری با adapter قبلی */
export type PaymentGatewayId = 'zarinpal' | 'zibal' | 'loan' | 'credit';

export interface PaymentRequestResult {
  authority: string;
  paymentUrl: string;
  message: string;
}

export interface PaymentVerifyResult {
  refId: string;
  message: string;
}

export interface PaymentGatewayAdapter {
  readonly gateway: Exclude<PaymentGatewayId, 'credit'>;
  requestPayment(
    amount: number,
    description: string,
    orderId: string,
  ): PaymentRequestResult;
  verifyPayment(authority: string, amount: number): PaymentVerifyResult;
  buildPaymentUrl(authority: string): string;
}
