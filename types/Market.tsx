import { Maturity } from './Date';

export type Market = {
  [key: string]: number | string | boolean | Maturity;
  symbol: string;
  market: string;
  collateralFactor: number;
};
