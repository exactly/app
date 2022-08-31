import { BigNumber } from 'ethers';

export type HealthFactor = {
  collateral: BigNumber;
  debt: BigNumber;
};
