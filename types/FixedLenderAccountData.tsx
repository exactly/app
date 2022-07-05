import { BigNumber } from '@ethersproject/bignumber';

export interface MaturityPosition {
  maturity: BigNumber;
  position: Position;
}

export interface Position {
  fee: BigNumber;
  principal: BigNumber;
}

export interface MaturityLiquidity {
  maturity: BigNumber;
  assets: BigNumber;
}

export type FixedLenderAccountData = {
  market: string;
  assetSymbol: string;
  maturitySupplyPositions: Array<MaturityPosition>;
  maturityBorrowPositions: Array<MaturityPosition>;
  smartPoolAssets: BigNumber;
  smartPoolShares: BigNumber;
  oraclePrice: BigNumber;
  penaltyRate: BigNumber;
  adjustFactor: BigNumber;
  decimals: number;
  isCollateral: boolean;
  availableLiquidity: MaturityLiquidity[];
};
