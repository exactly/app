import { Address } from 'viem';

export type WithdrawMP = {
  id: string;
  market: Address;
  maturity: bigint;
  positionAssets: bigint;
  assets: bigint;
  timestamp: number;
};
