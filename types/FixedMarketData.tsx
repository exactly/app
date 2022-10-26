import { BigNumber } from '@ethersproject/bignumber';

export interface PreviewFixedAtAllMaturities {
  maturity: BigNumber; // timestamp - id of the maturity
  assets: BigNumber; // amount of assets to be paid when maturity finishes
  utilization: BigNumber; // how much there is to borrow based on the actual lends/deposits
}

export type FixedMarketData = {
  market: string;
  decimals: number;
  assets: BigNumber;
  deposits: PreviewFixedAtAllMaturities[];
  borrows: PreviewFixedAtAllMaturities[];
};
