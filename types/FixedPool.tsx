import { Address } from 'viem';

export type Pool = {
  maturity: bigint;
  symbol: string;
  market: Address;
  fee: bigint;
  decimals: number;
  previewValue: bigint;
  valueUSD?: number;
};

export type FixedPool = Record<string, Pool[]>;
