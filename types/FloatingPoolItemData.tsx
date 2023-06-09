export type FloatingPoolItemData = {
  symbol: string;
  depositedAmount?: bigint;
  borrowedAmount?: bigint;
  apr?: number;
  valueUSD?: number;
  market?: string;
};
