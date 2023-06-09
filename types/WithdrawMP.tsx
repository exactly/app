import { Address } from 'viem';

export type WithdrawMP = {
  id: string;
  market: Address;
  maturity: number;
  positionAssets: bigint;
  assets: bigint;
  timestamp: number;
};
