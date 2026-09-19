/** درگاه بانکی (زرین‌پال، زیبال، …) */
export interface IBank {
  readonly kind: 'bank';
  readonly gateway: 'zarinpal' | 'zibal';
  requestPayment(
    amount: number,
    description: string,
    orderId: string,
  ): PaymentExternalRequestResult;
  verifyPayment(trackId: string, amount: number): PaymentExternalVerifyResult;
  buildPaymentUrl(trackId: string): string;
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
  verifyPayment(trackId: string, amount: number): PaymentExternalVerifyResult;
  buildPaymentUrl(trackId: string): string;
}

export type ExternalPaymentProvider = IBank | ILoan;

export interface PaymentExternalRequestResult {
  trackId: string;
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
  trackId: string;
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
  verifyPayment(trackId: string, amount: number): PaymentVerifyResult;
  buildPaymentUrl(trackId: string): string;
}
