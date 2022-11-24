import { BigNumber } from '@ethersproject/bignumber';

type Pool = {
  maturity: string;
  symbol: string;
  market: string;
  fee: BigNumber;
  principal: BigNumber;
  decimals: number;
};

export type FixedPool = Record<string, Pool[]>;
