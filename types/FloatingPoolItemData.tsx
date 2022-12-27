import type { BigNumber } from '@ethersproject/bignumber';

export type FloatingPoolItemData = {
  symbol: string;
  exaTokens?: BigNumber;
  depositedAmount?: BigNumber;
  borrowedAmount?: BigNumber;
  market?: string;
};
