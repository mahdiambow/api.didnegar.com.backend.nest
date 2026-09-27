/**
 * Contract for a third-party payment gateway.
 *
 * This belongs to utilities because it describes an external integration,
 * rather than the application's deposits domain.
 */
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

export interface PaymentInquiryResult {
  accepted: boolean;
  refId?: string;
  createdAt?: Date;
  paidAt?: Date;
  verifiedAt?: Date;
  description?: string;
}

export interface PaymentGateway {
  readonly kind: 'bank' | 'loan';
  readonly gateway: 'iBank' | 'loan';
  requestPayment(
    amount: number,
    description: string,
    orderId: string,
    callbackUrl?: string,
  ): Promise<PaymentRequestResult> | PaymentRequestResult;
  verifyPayment(
    trackId: string,
    expectedAmount: number,
  ): Promise<PaymentVerifyResult> | PaymentVerifyResult;
  buildPaymentUrl(trackId: string): string;
  inquiryPayment?(
    trackId: string,
    expectedAmount: number,
  ): Promise<PaymentInquiryResult> | PaymentInquiryResult;
}

/** A deposit uses one external gateway; its implementation lives in utilities. */
export type ExternalPaymentProvider = PaymentGateway;

// Kept as descriptive aliases for the existing loan adapter.
export type PaymentExternalRequestResult = PaymentRequestResult;
export type PaymentExternalVerifyResult = PaymentVerifyResult;
export type IBank = PaymentGateway & { readonly kind: 'bank'; readonly gateway: 'iBank' };
export type ILoan = PaymentGateway & { readonly kind: 'loan'; readonly gateway: 'loan' };
