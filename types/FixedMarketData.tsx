import { BigNumber } from '@ethersproject/bignumber';

export interface PreviewFixedAtAllMaturities {
  maturity: BigNumber;
  assets: BigNumber;
  utilization: BigNumber;
}

export type FixedMarketData = {
  market: string;
  decimals: number;
  assets: BigNumber;
  deposits: PreviewFixedAtAllMaturities[];
  borrows: PreviewFixedAtAllMaturities[];
};
