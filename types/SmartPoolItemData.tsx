import { BigNumber } from 'ethers';

export type SmartPoolItemData = {
  symbol: string;
  eTokens: BigNumber;
  depositedAmount: BigNumber;
  borrowedAmount: BigNumber;
  market: string;
};
