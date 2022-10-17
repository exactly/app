/* eslint-disable import/no-anonymous-default-export */
import request from 'graphql-request';
import { formatFixed } from '@ethersproject/bignumber';
import { lnWad, WAD } from './fixedPointMathLib';

const FIXED_INTERVAL = 86_400 * 7 * 4;
const PRECISION_THRESHOLD = 750_000_000_000_000n;

const min = (a: bigint, b: bigint) => (a < b ? a : b);
const max = (a: bigint, b: bigint) => (a > b ? a : b);

const floatingRate = (
  interestRateModel: InterestRateModel,
  utilizationBefore: bigint,
  utilizationAfter: bigint,
) => {
  const curveA = BigInt(interestRateModel.floatingCurveA);
  const curveB = BigInt(interestRateModel.floatingCurveB);
  const maxUtilization = BigInt(interestRateModel.floatingMaxUtilization);
  const alpha = maxUtilization - utilizationBefore;
  const delta = utilizationAfter - utilizationBefore;

  return ((delta * WAD) / alpha < PRECISION_THRESHOLD
    ? ((curveA * WAD) / alpha
      + (curveA * 4n * WAD) / (maxUtilization - ((utilizationAfter + utilizationBefore) / 2n))
      + (curveA * WAD) / (maxUtilization - utilizationAfter)) / 6n
    : (curveA * lnWad((alpha * WAD) / (maxUtilization - utilizationAfter))) / delta
  ) + curveB;
};

const totalFloatingBorrowAssets = (
  timestamp: number,
  { floatingAssets, floatingDebt }: MarketState,
  { timestamp: debtUpdate, utilization }: FloatingDebtState,
  interestRateModel: InterestRateModel,
) => {
  const newUtilization = BigInt(floatingAssets) > 0n
    ? (BigInt(floatingDebt) * WAD) / BigInt(floatingAssets)
    : 0n;
  const borrowRate = floatingRate(
    interestRateModel,
    min(BigInt(utilization), newUtilization),
    max(BigInt(utilization), newUtilization),
  );
  return BigInt(floatingDebt)
    + (BigInt(floatingDebt) * ((borrowRate * BigInt(timestamp - debtUpdate)) / 31_536_000n))
    / WAD;
};

const totalAssets = (
  timestamp: number,
  marketState: MarketState,
  floatingDebtState: FloatingDebtState,
  interestRateModel: InterestRateModel,
  accumulatorAccrual: number,
  smoothFactor: string,
  treasuryFeeRate: string,
  fixedPools: FixedPool[],
) => {
  const { floatingAssets, floatingDebt, earningsAccumulator } = marketState;
  const maxFuturePools = fixedPools.length - 1;
  const elapsed = BigInt(timestamp - accumulatorAccrual);
  return (
    BigInt(floatingAssets)

    + fixedPools.filter(Boolean).reduce((
      smartPoolEarnings,
      { timestamp: lastAccrual, maturity, unassignedEarnings },
    ) => (
      smartPoolEarnings
      + (maturity > lastAccrual
        ? (timestamp < maturity
          ? (BigInt(unassignedEarnings) * BigInt(timestamp - lastAccrual))
          / BigInt(maturity - lastAccrual)
          : BigInt(unassignedEarnings))
        : 0n)
    ), 0n)

    + (elapsed
      && (BigInt(earningsAccumulator) * elapsed)
      / (elapsed + (BigInt(smoothFactor) * BigInt(maxFuturePools * FIXED_INTERVAL)) / WAD))

    + ((
      totalFloatingBorrowAssets(timestamp, marketState, floatingDebtState, interestRateModel)
      - BigInt(floatingDebt)
    ) * (WAD - BigInt(treasuryFeeRate))) / WAD
  );
};

export default async (
  subgraph: string,
  market: string,
  type: 'deposit' | 'borrow',
  {
    maxFuturePools,
    roundTicks = false,
    interval = 3_600,
    offset = 0,
    count = 1,
  }: {
    maxFuturePools?: number;
    roundTicks?: boolean;
    interval?: number;
    offset?: number;
    count?: number;
  } = {},
) => {
  const now = Math.floor(Date.now() / 1_000) - offset * interval;
  const lastTimestamp = roundTicks ? now - (now % interval) : now;
  const response = await request(subgraph, `{${[...Array(count + 1)].map((_, i) => {
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
      ${type === 'deposit' ? `
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
        ${[...new Array(maxFuturePools! + 1)]
    .map((__, j) => timestamp - (timestamp % FIXED_INTERVAL) + j * FIXED_INTERVAL)
    .map((maturity) => `
          ${key}_pool_${maturity}: fixedEarningsUpdates(
            first: 1
            orderBy: timestamp
            orderDirection: desc
            where: { market: "${market}", timestamp_lte: ${timestamp}, maturity: ${maturity} }
          ) {
            timestamp
            maturity
            unassignedEarnings
          }
        `).join('')}
      ` : ''}
    `;
  }).join('')}}`.replace(/\s+/g, ' '));

  const states = [...Array(count + 1)].map((_, i) => {
    const timestamp = lastTimestamp - (count - i) * interval;
    const key = `k_${market}_${timestamp}`;
    const marketState = response[`${key}_marketState`][0] as MarketState;
    const floatingDebtState = response[`${key}_floatingDebtState`][0] as FloatingDebtState;
    const interestRateModel = response[`${key}_interestRateModel`][0] as InterestRateModel;
    const accumulatorAccrual = response[`${key}_accumulatorAccrual`]?.[0]?.accumulatorAccrual as number;
    const smoothFactor = response[`${key}_smoothFactor`]?.[0]?.smoothFactor as string;
    const treasuryFeeRate = response[`${key}_treasuryFeeRate`]?.[0]?.treasuryFeeRate as string ?? '0';
    const fixedPools = [...new Array(type === 'deposit' ? maxFuturePools! + 1 : 0)]
      .map((__, j) => timestamp - (timestamp % FIXED_INTERVAL) + j * FIXED_INTERVAL)
      .map((maturity) => response[`${key}_pool_${maturity}`]?.[0] as FixedPool);

    return {
      timestamp,
      ...marketState ? {
        utilization: BigInt(marketState.floatingAssets)
          && (BigInt(marketState.floatingDebt) * WAD) / BigInt(marketState.floatingAssets),
        shares: BigInt({
          deposit: marketState.floatingDepositShares,
          borrow: marketState.floatingBorrowShares,
        }[type]),
        assets: {
          deposit: totalAssets,
          borrow: totalFloatingBorrowAssets,
        }[type](
          timestamp,
          marketState,
          floatingDebtState,
          interestRateModel,
          accumulatorAccrual,
          smoothFactor,
          treasuryFeeRate,
          fixedPools,
        ),
      } : { utilization: 0n, shares: 0n, assets: 0n },
    };
  });

  return states.slice(1).map(({
    timestamp, utilization, shares, assets,
  }, i) => {
    const prevShareValue = states[i].shares ? (states[i].assets * WAD) / states[i].shares : WAD;
    const shareValue = shares ? (assets * WAD) / shares : WAD;
    const proportion = (shareValue * WAD) / prevShareValue;
    return {
      date: new Date(timestamp * 1_000),
      apr: (Number(formatFixed(proportion, 18)) - 1) * (31_536_000 / interval),
      apy: Number(formatFixed(proportion, 18)) ** (31_536_000 / interval) - 1,
      utilization: Number(formatFixed(utilization, 18)),
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
