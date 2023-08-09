import { Address } from 'viem';

export type Deposit = {
  id: string;
  market: Address;
  maturity: bigint;
  assets: bigint;
  fee: bigint;
  timestamp: number;
};
