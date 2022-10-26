import { lnWad, WAD } from './fixedPointMathLib';

export { WAD };

export const INTERVAL = 86_400 * 7 * 4;

const min = (a: bigint, b: bigint) => (a < b ? a : b);
const max = (a: bigint, b: bigint) => (a > b ? a : b);

const floatingRate = (
  { floatingCurveA, floatingCurveB, floatingMaxUtilization }: InterestRateModel,
  utilizationBefore: bigint,
  utilizationAfter: bigint,
) =>
  (utilizationAfter - utilizationBefore < 2_500_000_000n
    ? (BigInt(floatingCurveA) * WAD) / (BigInt(floatingMaxUtilization) - utilizationBefore)
    : (BigInt(floatingCurveA) *
        lnWad(
          ((BigInt(floatingMaxUtilization) - utilizationBefore) * WAD) /
            (BigInt(floatingMaxUtilization) - utilizationAfter),
        )) /
      (utilizationAfter - utilizationBefore)) + BigInt(floatingCurveB);

export const totalFloatingBorrowAssets = (
  timestamp: number,
  { floatingAssets, floatingDebt }: MarketState,
  { timestamp: debtUpdate, utilization }: FloatingDebtState,
  interestRateModel: InterestRateModel,
) => {
  const newUtilization = BigInt(floatingAssets) > 0n ? (BigInt(floatingDebt) * WAD) / BigInt(floatingAssets) : 0n;
  const borrowRate = floatingRate(
    interestRateModel,
    min(BigInt(utilization), newUtilization),
    max(BigInt(utilization), newUtilization),
  );
  return (
    BigInt(floatingDebt) + (BigInt(floatingDebt) * ((borrowRate * BigInt(timestamp - debtUpdate)) / 31_536_000n)) / WAD
  );
};

export const totalAssets = (
  timestamp: number,
  marketState: MarketState,
  accumulatorAccrual: number,
  maturities: FixedPool[],
  earningsAccumulatorSmoothFactor: string,
  floatingDebtState: FloatingDebtState,
  interestRateModel: InterestRateModel,
  treasuryFeeRate: string,
) => {
  const { floatingAssets, floatingDebt, earningsAccumulator } = marketState;
  const elapsed = BigInt(timestamp - accumulatorAccrual);
  return (
    BigInt(floatingAssets) +
    maturities.reduce(
      (smartPoolEarnings, { timestamp: lastAccrual, maturity, unassignedEarnings }) =>
        smartPoolEarnings +
        (maturity > lastAccrual
          ? (BigInt(unassignedEarnings) * BigInt(timestamp - lastAccrual)) / BigInt(maturity - lastAccrual)
          : 0n),
      0n,
    ) +
    (elapsed &&
      (BigInt(earningsAccumulator) * elapsed) /
        (elapsed + (BigInt(earningsAccumulatorSmoothFactor) * BigInt(maturities.length * INTERVAL)) / WAD)) +
    ((totalFloatingBorrowAssets(timestamp, marketState, floatingDebtState, interestRateModel) - BigInt(floatingDebt)) *
      (WAD - BigInt(treasuryFeeRate))) /
      WAD
  );
};

export const futurePools = (start: number, n: number, interval = INTERVAL) =>
  [...new Array(n)].map((_, i) => start - (start % interval) + interval * (i + 1));

export const DEFAULT_STATE = { timestamp: 0 };

export const DEFAULT_MARKET_STATE = {
  ...DEFAULT_STATE,
  floatingDepositShares: '0',
  floatingAssets: '0',
  floatingBorrowShares: '0',
  floatingDebt: '0',
  earningsAccumulator: '0',
};

export const DEFAULT_FLOATING_DEBT_STATE = { ...DEFAULT_STATE, utilization: '0' };

export interface State {
  timestamp: number;
}

export interface MarketState extends State {
  floatingDepositShares: string;
  floatingAssets: string;
  floatingBorrowShares: string;
  floatingDebt: string;
  earningsAccumulator: string;
}

export interface FloatingDebtState extends State {
  utilization: string;
}

export interface FixedPool extends State {
  maturity: number;
  unassignedEarnings: string;
}

export interface InterestRateModel {
  floatingCurveA: string;
  floatingCurveB: string;
  floatingMaxUtilization: string;
}
