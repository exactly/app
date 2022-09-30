import { BigNumber } from 'ethers';
import { Date } from './Date';

export type Market = {
  [key: string]: number | string | boolean | Date | BigNumber;
  symbol: string;
  name: string;
  market: string;
  isListed: boolean;
  collateralFactor: number;
};
