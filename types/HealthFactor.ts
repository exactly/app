import type { BigNumber } from '@ethersproject/bignumber';

export type HealthFactor = {
  collateral: BigNumber;
  debt: BigNumber;
};
