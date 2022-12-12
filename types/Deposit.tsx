import type { BigNumber } from '@ethersproject/bignumber';

export type Deposit = {
  id?: string;
  market: string;
  symbol?: string;
  maturity: number;
  assets: BigNumber;
  fee: BigNumber;
  owner?: string;
  caller?: string;
  timestamp: string;
  editable?: boolean;
};
