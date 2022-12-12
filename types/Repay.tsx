import { BigNumber } from '@ethersproject/bignumber';

export type Repay = {
  id: string;
  market: string;
  maturity: number;
  caller: string;
  borrower: string;
  assets: BigNumber;
  debtCovered: BigNumber;
  timestamp: string;
};
