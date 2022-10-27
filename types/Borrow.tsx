import type { BigNumber } from '@ethersproject/bignumber';

export type Borrow = {
  id?: string;
  market: string;
  symbol?: string;
  maturity: string;
  assets?: BigNumber;
  fee: BigNumber;
  caller?: string;
  receiver?: string;
  borrower?: string;
  timestamp?: string;
  editable?: boolean;
};
