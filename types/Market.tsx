export type Market = {
  [key: string]: number | string | boolean;
  symbol: string;
  name: string;
  address: string;
  isListed: boolean;
  collateralFactor: number;
};
