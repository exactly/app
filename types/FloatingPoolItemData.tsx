import type { BigNumber } from '@ethersproject/bignumber';

export type FloatingPoolItemData = {
  symbol: string;
  exaTokens?: BigNumber;
  valueUSD?: number;
  market?: string;
};
