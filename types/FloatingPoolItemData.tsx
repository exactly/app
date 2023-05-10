import type { BigNumber } from '@ethersproject/bignumber';

export type FloatingPoolItemData = {
  symbol: string;
  depositedAmount?: BigNumber;
  borrowedAmount?: BigNumber;
  apr?: number;
  valueUSD?: number;
  market?: string;
};
