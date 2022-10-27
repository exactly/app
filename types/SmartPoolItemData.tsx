import type { BigNumber } from '@ethersproject/bignumber';

export type SmartPoolItemData = {
  symbol: string;
  eTokens: BigNumber;
  depositedAmount: BigNumber;
  borrowedAmount: BigNumber;
  market: string;
};
