export type FixedPoolTransaction = {
  id: string;
  operation: 'borrow' | 'deposit' | 'repay' | 'withdraw';
  type: string;
  date: string;
  amount: string;
  amountUSD: string;
  isBorrowOrDeposit: boolean;
  APR?: number;
};
