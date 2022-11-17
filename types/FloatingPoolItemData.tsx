import type { BigNumber } from '@ethersproject/bignumber';

export type FloatingPoolItemData = {
  symbol: string;
  eTokens: BigNumber;
  depositedAmount: BigNumber;
  borrowedAmount: BigNumber;
  market: string;
};
