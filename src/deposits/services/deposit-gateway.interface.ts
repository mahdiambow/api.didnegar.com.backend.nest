/** درگاه بانکی (زرین‌پال، زیبال، …) */
export interface IBank {
  readonly kind: 'bank';
  readonly gateway: 'zarinpal' | 'zibal';
  requestPayment(
    amount: number,
    description: string,
    orderId: string,
  ): Promise<PaymentExternalRequestResult> | PaymentExternalRequestResult;
  verifyPayment(
    trackId: string,
    amount: number,
  ): Promise<PaymentExternalVerifyResult> | PaymentExternalVerifyResult;
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
  ): Promise<PaymentExternalRequestResult> | PaymentExternalRequestResult;
  verifyPayment(
    trackId: string,
    amount: number,
  ): Promise<PaymentExternalVerifyResult> | PaymentExternalVerifyResult;
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
  /** مبلغ تأییدشده توسط درگاه (ریال) — برای تطبیق با deposit */
  amount?: number;
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
  amount?: number;
}

export interface PaymentGatewayAdapter {
  readonly gateway: Exclude<PaymentGatewayId, 'credit'>;
  requestPayment(
    amount: number,
    description: string,
    orderId: string,
  ): Promise<PaymentRequestResult> | PaymentRequestResult;
  verifyPayment(
    trackId: string,
    amount: number,
  ): Promise<PaymentVerifyResult> | PaymentVerifyResult;
  buildPaymentUrl(trackId: string): string;
}
