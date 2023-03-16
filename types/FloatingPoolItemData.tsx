import type { BigNumber } from '@ethersproject/bignumber';

export type FloatingPoolItemData = {
  symbol: string;
  depositedAmount?: BigNumber;
  borrowedAmount?: BigNumber;
  valueUSD?: number;
  market?: string;
};
