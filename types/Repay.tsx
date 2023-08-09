import { Address } from 'viem';

export type Repay = {
  id: string;
  market: Address;
  maturity: bigint;
  assets: bigint;
  timestamp: number;
};
