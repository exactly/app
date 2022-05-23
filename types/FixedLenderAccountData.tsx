import { BigNumber } from '@ethersproject/bignumber';

export type FixedLenderAccountData = {
  fixedLenderAddress: string;
  assetSymbol: string;
  maturitySupplyPositions: Array<BigNumber>;
  maturityBorrowPositions: Array<BigNumber>;
  smartPoolAsstets: BigNumber;
  smartPoolShares: BigNumber;
  oraclePrice: BigNumber;
  penaltyRate: BigNumber;
  collateralFactor: BigNumber;
  decimals: number;
  isCollateral: boolean;
};
