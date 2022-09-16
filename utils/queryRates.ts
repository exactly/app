import request from 'graphql-request';
import { formatFixed } from '@ethersproject/bignumber';
import { lnWad, WAD } from './fixedPointMathLib';

const FIXED_INTERVAL = 86_400 * 7 * 4;

const min = (a: bigint, b: bigint) => (a < b ? a : b);
const max = (a: bigint, b: bigint) => (a > b ? a : b);

const floatingRate = (
  { floatingCurveA, floatingCurveB, floatingMaxUtilization }: InterestRateModel,
  utilizationBefore: bigint,
  utilizationAfter: bigint
) =>
  (utilizationAfter - utilizationBefore < 2_500_000_000n
    ? (BigInt(floatingCurveA) * WAD) / (BigInt(floatingMaxUtilization) - utilizationBefore)
    : (BigInt(floatingCurveA) *
        lnWad(
          ((BigInt(floatingMaxUtilization) - utilizationBefore) * WAD) /
            (BigInt(floatingMaxUtilization) - utilizationAfter)
        )) /
      (utilizationAfter - utilizationBefore)) + BigInt(floatingCurveB);

const totalFloatingBorrowAssets = (
  timestamp: number,
  { floatingAssets, floatingDebt }: MarketState,
  { timestamp: debtUpdate, utilization }: FloatingDebtState,
  interestRateModel: InterestRateModel
) => {
  const newUtilization =
    BigInt(floatingAssets) > 0n ? (BigInt(floatingDebt) * WAD) / BigInt(floatingAssets) : 0n;
  const borrowRate =
    interestRateModel && BigInt(interestRateModel.floatingCurveA)
      ? floatingRate(
          interestRateModel,
          min(BigInt(utilization), newUtilization),
          max(BigInt(utilization), newUtilization)
        )
      : 0n;
  return (
    BigInt(floatingDebt) +
    (BigInt(floatingDebt) * ((borrowRate * BigInt(timestamp - debtUpdate)) / 31_536_000n)) / WAD
  );
};

const totalAssets = (
  timestamp: number,
  marketState: MarketState,
  floatingDebtState: FloatingDebtState,
  interestRateModel: InterestRateModel,
  accumulatorAccrual: number,
  smoothFactor: string,
  treasuryFeeRate: string,
  fixedPools: FixedPool[]
) => {
  const { floatingAssets, floatingDebt, earningsAccumulator } = marketState;
  const elapsed = BigInt(timestamp - accumulatorAccrual);
  return (
    BigInt(floatingAssets) +
    fixedPools.reduce(
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
        (elapsed + (BigInt(smoothFactor) * BigInt(fixedPools.length * FIXED_INTERVAL)) / WAD)) +
    ((totalFloatingBorrowAssets(timestamp, marketState, floatingDebtState, interestRateModel) -
      BigInt(floatingDebt)) *
      (WAD - BigInt(treasuryFeeRate))) /
      WAD
  );
};

const DEFAULT_STATE = { timestamp: 0 };

const DEFAULT_MARKET_STATE = {
  ...DEFAULT_STATE,
  floatingDepositShares: '0',
  floatingAssets: '0',
  floatingBorrowShares: '0',
  floatingDebt: '0',
  earningsAccumulator: '0'
};

const DEFAULT_FLOATING_DEBT_STATE = { ...DEFAULT_STATE, utilization: '0' };

export default async (
  subgraph: string,
  market: string,
  type: 'deposit' | 'borrow',
  {
    maxFuturePools = 0, // HACK
    roundTicks = false,
    interval = 3_600,
    count = 1
  }: { maxFuturePools?: number; roundTicks?: boolean; interval?: number; count?: number } = {}
) => {
  const now = Math.floor(Date.now() / 1_000);
  const lastTimestamp = roundTicks ? now - (now % interval) : now;
  const response = await request(
    subgraph,
    `{${[...Array(count + 1)]
      .map((_, i) => {
        const timestamp = lastTimestamp - interval * i;
        const key = `k_${market}_${timestamp}`;
        return `
      ${key}_marketState: marketUpdates(
        first: 1
        orderBy: timestamp
        orderDirection: desc
        where: { market: "${market}", timestamp_lte: ${timestamp} }
      ) {
        timestamp
        floatingDepositShares
        floatingAssets
        floatingBorrowShares
        floatingDebt
        earningsAccumulator
      }
      ${key}_floatingDebtState: floatingDebtUpdates(
        first: 1
        orderBy: timestamp
        orderDirection: desc
        where: { market: "${market}", timestamp_lte: ${timestamp} }
      ) {
        timestamp
        utilization
      }
      ${key}_interestRateModel: interestRateModelSets(
        first: 1
        orderBy: timestamp
        orderDirection: desc
        where: { market: "${market}", timestamp_lte: ${timestamp} }
      ) {
        floatingCurveA
        floatingCurveB
        floatingMaxUtilization
      }
      ${
        type === 'deposit'
          ? `
        ${key}_accumulatorAccrual: accumulatorAccruals(
          first: 1
          orderBy: timestamp
          orderDirection: desc
          where: { market: "${market}", timestamp_lte: ${timestamp} }
        ) {
          accumulatorAccrual: timestamp
        }
        ${key}_smoothFactor: earningsAccumulatorSmoothFactorSets(
          first: 1
          orderBy: timestamp
          orderDirection: desc
          where: { market: "${market}", timestamp_lte: ${timestamp} }
        ) {
          smoothFactor: earningsAccumulatorSmoothFactor
        }
        ${key}_treasuryFeeRate: treasurySets(
          first: 1
          orderBy: timestamp
          orderDirection: desc
          where: { market: "${market}", timestamp_lte: ${timestamp} }
        ) {
          treasuryFeeRate
        }
        ${[...new Array(maxFuturePools + 1)]
          .map((__, j) => timestamp - (timestamp % FIXED_INTERVAL) + FIXED_INTERVAL * j)
          .map(
            (maturity) => `
          ${key}_pool_${maturity}: fixedEarningsUpdates(
            first: 1
            orderBy: timestamp
            orderDirection: desc
            where: { market: "${market}", maturity: ${maturity}, timestamp_lte: ${timestamp} }
          ) {
            timestamp
            maturity
            unassignedEarnings
          }
        `
          )
          .join('')}
      `
          : ''
      }
    `;
      })
      .join('')}}`.replace(/\s+/g, ' ')
  );

  const states = [...Array(count + 1)].map((_, i) => {
    const timestamp = lastTimestamp - (count - i) * interval;
    const key = `k_${market}_${timestamp}`;
    const marketState = (response[`${key}_marketState`][0] as MarketState) ?? DEFAULT_MARKET_STATE;
    const floatingDebtState =
      (response[`${key}_floatingDebtState`][0] as FloatingDebtState) ?? DEFAULT_FLOATING_DEBT_STATE;
    const interestRateModel = response[`${key}_interestRateModel`][0] as InterestRateModel;
    const accumulatorAccrual = response[`${key}_accumulatorAccrual`]?.[0]?.accumulatorAccrual;
    const smoothFactor = response[`${key}_smoothFactor`]?.[0]?.smoothFactor;
    const treasuryFeeRate = response[`${key}_treasuryFeeRate`]?.[0]?.treasuryFeeRate;
    const fixedPools = (Object.entries(response) as any) // HACK
      .filter(([k, pools]: [string, unknown[]]) => pools.length && k.startsWith(`${key}_pool_`))
      .map(([, [pool]]: [string, FixedPool[]]) => pool);

    return {
      timestamp,
      utilization:
        BigInt(marketState.floatingAssets) &&
        (BigInt(marketState.floatingDebt) * WAD) / BigInt(marketState.floatingAssets),
      shares: BigInt(
        {
          deposit: marketState.floatingDepositShares,
          borrow: marketState.floatingBorrowShares
        }[type]
      ),
      assets: {
        deposit: totalAssets,
        borrow: totalFloatingBorrowAssets
      }[type](
        timestamp,
        marketState,
        floatingDebtState,
        interestRateModel,
        accumulatorAccrual,
        smoothFactor,
        treasuryFeeRate,
        fixedPools
      )
    };
  });

  return states.slice(1).map(({ timestamp, utilization, shares, assets }, i) => {
    const denominator = states[i].shares ? (states[i].assets * WAD) / states[i].shares : WAD;
    const result = (((assets * WAD) / shares) * WAD) / denominator;
    return {
      date: new Date(timestamp * 1_000),
      rate: (Number(formatFixed(result, 18)) ** (31_536_000 / interval) - 1) * 100,
      utilization: Number(formatFixed(utilization, 18))
    };
  });
};

interface State {
  timestamp: number;
}

interface MarketState extends State {
  floatingDepositShares: string;
  floatingAssets: string;
  floatingBorrowShares: string;
  floatingDebt: string;
  earningsAccumulator: string;
}

interface FloatingDebtState extends State {
  utilization: string;
}

interface FixedPool extends State {
  maturity: number;
  unassignedEarnings: string;
}

interface InterestRateModel {
  floatingCurveA: string;
  floatingCurveB: string;
  floatingMaxUtilization: string;
}
