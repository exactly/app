import { BigNumber } from '@ethersproject/bignumber';

export type Pool = {
  maturity: string;
  symbol: string;
  market: string;
  fee: BigNumber;
  decimals: number;
  previewValue: BigNumber;
};

export type FixedPool = Record<string, Pool[]>;
