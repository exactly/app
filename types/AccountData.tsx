import { BigNumber } from '@ethersproject/bignumber';

export type AccountData = {
  fixedLenderAddress: string;
  symbol: string;
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
