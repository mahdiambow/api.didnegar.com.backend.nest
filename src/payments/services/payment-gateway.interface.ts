export type PaymentGatewayId = 'zarinpal' | 'zibal';

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
  readonly gateway: PaymentGatewayId;
  requestPayment(amount: number, description: string, orderId: string): PaymentRequestResult;
  verifyPayment(authority: string, amount: number): PaymentVerifyResult;
  buildPaymentUrl(authority: string): string;
}
