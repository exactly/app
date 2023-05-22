import type { BigNumber } from '@ethersproject/bignumber';

export type Borrow = {
  id: string;
  market: string;
  maturity: number;
  assets: BigNumber;
  fee: BigNumber;
  caller?: string;
  receiver?: string;
  borrower?: string;
  timestamp: string;
  editable?: boolean;
};
