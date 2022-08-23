import { lnWad, WAD } from './fixedPointMathLib';

export { WAD };

export const INTERVAL = 86_400 * 7 * 4;

const min = (a: bigint, b: bigint) => (a < b ? a : b);
const max = (a: bigint, b: bigint) => (a > b ? a : b);

const floatingRate = (
  { curveA, curveB, maxUtilization }: IRMParameters,
  utilizationBefore: bigint,
  utilizationAfter: bigint
) =>
  (BigInt(utilizationAfter) - BigInt(utilizationBefore) < 2_500_000_000n
    ? (BigInt(curveA) * WAD) / (BigInt(maxUtilization) - BigInt(utilizationBefore))
    : (BigInt(curveA) *
        lnWad(
          ((BigInt(maxUtilization) - BigInt(utilizationBefore)) * WAD) /
            (BigInt(maxUtilization) - BigInt(utilizationAfter))
        )) /
      (BigInt(utilizationAfter) - BigInt(utilizationBefore))) + BigInt(curveB);

export const totalFloatingBorrowAssets = (
  timestamp: number,
  { floatingAssets, floatingDebt }: MarketState,
  { timestamp: debtUpdate, utilization }: FloatingDebtState,
  floatingParameters: IRMParameters
) => {
  const { fullUtilization } = floatingParameters;
  const newUtilization =
    BigInt(floatingAssets) > 0n
      ? (BigInt(floatingDebt) * WAD) / ((BigInt(floatingAssets) * WAD) / BigInt(fullUtilization))
      : 0n;
  const borrowRate = floatingRate(
    floatingParameters,
    min(BigInt(utilization), newUtilization),
    max(BigInt(utilization), newUtilization)
  );
  return (
    BigInt(floatingDebt) +
    (BigInt(floatingDebt) * ((borrowRate * BigInt(timestamp - debtUpdate)) / 31_536_000n)) / WAD
  );
};

export const totalAssets = (
  timestamp: number,
  marketState: MarketState,
  accumulatorAccrual: number,
  maturities: FixedPool[],
  earningsAccumulatorSmoothFactor: string,
  floatingDebtState: FloatingDebtState,
  floatingParameters: IRMParameters,
  treasuryFeeRate: string
) => {
  const { floatingAssets, floatingDebt, earningsAccumulator } = marketState;
  const elapsed = BigInt(timestamp - accumulatorAccrual);
  return (
    BigInt(floatingAssets) +
    maturities.reduce(
      (smartPoolEarnings, { timestamp: lastAccrual, maturity, unassignedEarnings }) =>
        smartPoolEarnings +
        (maturity > lastAccrual
          ? (BigInt(unassignedEarnings) * BigInt(timestamp - lastAccrual)) /
            BigInt(maturity - lastAccrual)
          : 0n),
      0n
    ) +
    (elapsed &&
      (BigInt(earningsAccumulator) * elapsed) /
        (elapsed +
          (BigInt(earningsAccumulatorSmoothFactor) * BigInt(maturities.length * INTERVAL)) / WAD)) +
    ((totalFloatingBorrowAssets(timestamp, marketState, floatingDebtState, floatingParameters) -
      BigInt(floatingDebt)) *
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
  earningsAccumulator: '0'
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

export interface IRMParameters {
  curveA: string;
  curveB: string;
  maxUtilization: string;
  fullUtilization: string;
}
