import { Maturity } from './Maturity';

export type Market = {
  [key: string]: number | string | boolean | Maturity;
  symbol: string;
  market: string;
  collateralFactor: number;
};
