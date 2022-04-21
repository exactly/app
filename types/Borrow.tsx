export type Borrow = {
  id: string;
  market: string;
  maturity: string;
  caller: string;
  receiver: string;
  borrower: string;
  assets: string;
  fee: string;
  symbol?: string;
};
