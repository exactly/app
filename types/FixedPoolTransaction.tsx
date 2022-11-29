export type FixedPoolTransaction = {
  id: string;
  type: string;
  date: string;
  amount: string;
  amountUSD: string;
  isBorrowOrDeposit: boolean;
  APR?: number;
};
