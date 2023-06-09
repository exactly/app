import { Address } from 'viem';

export type Pool = {
  maturity: number;
  symbol: string;
  market: Address;
  fee: bigint;
  decimals: number;
  previewValue: bigint;
  valueUSD?: number;
};

export type FixedPool = Record<string, Pool[]>;
