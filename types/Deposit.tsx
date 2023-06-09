import { Address } from 'viem';

export type Deposit = {
  id: string;
  market: Address;
  maturity: number;
  assets: bigint;
  fee: bigint;
  timestamp: number;
};
