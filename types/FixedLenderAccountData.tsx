import { BigNumber } from '@ethersproject/bignumber';

export interface MaturityPostion {
  maturity: BigNumber;
  position: Position;
}

export interface Position {
  fee: BigNumber;
  principal: BigNumber;
}

export type FixedLenderAccountData = {
  fixedLenderAddress: string;
  assetSymbol: string;
  maturitySupplyPositions: Array<MaturityPostion>;
  maturityBorrowPositions: Array<MaturityPostion>;
  smartPoolAssets: BigNumber;
  smartPoolShares: BigNumber;
  oraclePrice: BigNumber;
  penaltyRate: BigNumber;
  collateralFactor: BigNumber;
  decimals: number;
  isCollateral: boolean;
};
