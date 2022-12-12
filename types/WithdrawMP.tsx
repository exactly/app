import { BigNumber } from '@ethersproject/bignumber';

export type WithdrawMP = {
  id: string;
  market: string;
  maturity: number;
  caller: string;
  receiver: string;
  owner: string;
  positionAssets: BigNumber;
  assets: BigNumber;
  timestamp: string;
};
