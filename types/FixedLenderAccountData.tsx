import { BigNumber } from '@ethersproject/bignumber';

export interface MaturityPosition {
  maturity: BigNumber;
  position: Position;
}

export interface Position {
  fee: BigNumber;
  principal: BigNumber;
}

export interface FixedPool {
  maturity: BigNumber;
  borrowed: BigNumber;
  supplied: BigNumber;
  available: BigNumber;
  utilization: BigNumber;
}

export type FixedLenderAccountData = {
  market: string;
  decimals: number;
  assetSymbol: string;
  usdPrice: BigNumber;
  penaltyRate: BigNumber;
  adjustFactor: BigNumber;
  maxBorrowAssets: BigNumber;
  maxFuturePools: number;
  fixedPools: Array<FixedPool>;
  floatingBackupBorrowed: BigNumber;
  floatingAvailableAssets: BigNumber;
  totalFloatingBorrowAssets: BigNumber;
  totalFloatingDepositAssets: BigNumber;
  isCollateral: boolean;
  floatingBorrowShares: BigNumber;
  floatingBorrowAssets: BigNumber;
  floatingDepositShares: BigNumber;
  floatingDepositAssets: BigNumber;
  fixedDepositPositions: Array<MaturityPosition>;
  fixedBorrowPositions: Array<MaturityPosition>;
};
