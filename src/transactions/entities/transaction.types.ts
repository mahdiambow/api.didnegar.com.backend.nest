export type TransactionSourceType =
  | 'DEPOSIT'
  | 'WITHDRAW'
  | 'ORDER_PAYMENT'
  | 'REFUND'
  | 'ADMIN'
  | 'PENALTY';

export const transactionSourceTypes: TransactionSourceType[] = [
  'DEPOSIT',
  'WITHDRAW',
  'ORDER_PAYMENT',
  'REFUND',
  'ADMIN',
  'PENALTY',
];

export type TransactionState =
  | 'executed'
  | 'pending'
  | 'rejected'
  | 'pending-admin';

export const transactionStates: TransactionState[] = [
  'executed',
  'pending',
  'rejected',
  'pending-admin',
];

/** جهت حرکت پول نسبت به اعتبار کاربر */
export type TransactionType = 'credit' | 'debit';

export type TransactionUserType = 'user' | 'admin' | 'system';
