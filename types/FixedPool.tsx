import { BigNumber } from '@ethersproject/bignumber';

export type Pool = {
  maturity: number;
  symbol: string;
  market: string;
  fee: BigNumber;
  decimals: number;
  previewValue: BigNumber;
  valueUSD?: number;
};

export type FixedPool = Record<string, Pool[]>;
