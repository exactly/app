import { BigNumber } from '@ethersproject/bignumber';

export interface MaturityPosition {
  maturity: BigNumber;
  position: Position;
}

export interface Position {
  fee: BigNumber;
  principal: BigNumber;
}

export type FixedLenderAccountData = {
  fixedLender: string;
  assetSymbol: string;
  maturitySupplyPositions: Array<MaturityPosition>;
  maturityBorrowPositions: Array<MaturityPosition>;
  smartPoolAssets: BigNumber;
  smartPoolShares: BigNumber;
  oraclePrice: BigNumber;
  penaltyRate: BigNumber;
  collateralFactor: BigNumber;
  decimals: number;
  isCollateral: boolean;
};
