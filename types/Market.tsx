import { Date } from './Date';

export type Market = {
  [key: string]: number | string | boolean | Date;
  symbol: string;
  name: string;
  market: string;
  isListed: boolean;
  collateralFactor: number;
};
