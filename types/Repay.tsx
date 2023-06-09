import { Address } from 'viem';

export type Repay = {
  id: string;
  market: Address;
  maturity: number;
  assets: bigint;
  timestamp: number;
};
