import { Address } from 'viem';

export type Borrow = {
  id: string;
  market: Address;
  maturity: number;
  assets: bigint;
  fee: bigint;
  timestamp: number;
};
