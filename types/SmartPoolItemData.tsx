import { BigNumber } from 'ethers';

export type SmartPoolItemData = {
  symbol: string;
  eTokens: BigNumber;
  tokens: BigNumber;
};
