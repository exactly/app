import { Address } from 'viem';

export type Borrow = {
  id: string;
  market: Address;
  maturity: bigint;
  assets: bigint;
  fee: bigint;
  timestamp: number;
};
