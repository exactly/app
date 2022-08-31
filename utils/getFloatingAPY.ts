import request from 'graphql-request';
import { formatFixed } from '@ethersproject/bignumber';
import {
  DEFAULT_FLOATING_DEBT_STATE,
  DEFAULT_MARKET_STATE,
  DEFAULT_STATE,
  WAD,
  futurePools,
  totalAssets
} from './floatingAPY';
import type {
  FixedPool,
  FloatingDebtState,
  InterestRateModel,
  MarketState,
  State
} from './floatingAPY';

export default async (market: string, SUBGRAPH_URL: string, maxFuturePools = 3) => {
  const timeWindow = {
    start: Math.floor(Date.now() / 1_000) - 3_600,
    end: Math.floor(Date.now() / 1_000)
  };
  const {
    initial: [initial = DEFAULT_MARKET_STATE],
    final: [final = initial],
    initialAccumulatorAccrual: [{ timestamp: initialAccumulatorAccrual } = DEFAULT_STATE],
    finalAccumulatorAccrual: [{ timestamp: finalAccumulatorAccrual } = { timestamp: 0 }],
    earningsAccumulatorSmoothFactor: [{ earningsAccumulatorSmoothFactor }],
    initialDebtUpdate: [initialDebtUpdate = DEFAULT_FLOATING_DEBT_STATE],
    finalDebtUpdate: [finalDebtUpdate = initialDebtUpdate],
    interestRateModel: [interestRateModel],
    treasuryFeeRate: [{ treasuryFeeRate }],
    ...allMaturities
  } = (await request(
    SUBGRAPH_URL,
    `
    query(
      $market: Bytes
      $start: Int
    ) {
      initial: marketUpdates(
        first: 1
        orderBy: timestamp
        orderDirection: desc
        where: { market: $market, timestamp_lte: $start }
      ) {
        timestamp
        floatingDepositShares
        floatingAssets
        floatingBorrowShares
        floatingDebt
        earningsAccumulator
      }
      final: marketUpdates(
        first: 1
        orderBy: timestamp
        orderDirection: desc
        where: { market: $market }
      ) {
        timestamp
        floatingDepositShares
        floatingAssets
        floatingBorrowShares
        floatingDebt
        earningsAccumulator
      }
      initialAccumulatorAccrual: accumulatorAccruals(
        first: 1
        orderBy: timestamp
        orderDirection: desc
        where: { market: $market, timestamp_lte: $start }
      ) {
        timestamp
      }
      finalAccumulatorAccrual: accumulatorAccruals(
        first: 1
        orderBy: timestamp
        orderDirection: desc
        where: { market: $market }
      ) {
        timestamp
      }
      initialDebtUpdate: floatingDebtUpdates(
        first: 1
        orderBy: timestamp
        orderDirection: desc
        where: { market: $market, timestamp_lte: $start }
      ) {
        timestamp
        utilization
      }
      finalDebtUpdate: floatingDebtUpdates(
        first: 1
        orderBy: timestamp
        orderDirection: desc
        where: { market: $market }
      ) {
        timestamp
        utilization
      }
      earningsAccumulatorSmoothFactor: earningsAccumulatorSmoothFactorSets(
        first: 1
        orderBy: timestamp
        orderDirection: desc
        where: { market: $market }
      ) {
        earningsAccumulatorSmoothFactor
      }
      treasuryFeeRate: treasurySets(
        first: 1
        orderBy: timestamp
        orderDirection: desc
        where: { market: $market }
      ) {
        treasuryFeeRate
      }
      interestRateModel: interestRateModelSets(
        first: 1
        orderBy: timestamp
        orderDirection: desc
        where: { market: $market }
      ) {
        floatingCurveA
        floatingCurveB
        floatingMaxUtilization
      }
      ${futurePools(timeWindow.start, maxFuturePools)
        .map(
          (maturity) => `
        initial${maturity}: fixedEarningsUpdates(
          first: 1
          orderBy: timestamp
          orderDirection: desc
          where: { market: $market, maturity: ${maturity}, timestamp_lte: $start }
        ) {
          timestamp
          maturity
          unassignedEarnings
        }
      `
        )
        .join('')}
      ${futurePools(timeWindow.end, maxFuturePools)
        .map(
          (maturity) => `
        final${maturity}: fixedEarningsUpdates(
          first: 1
          orderBy: timestamp
          orderDirection: desc
          where: { market: $market, maturity: ${maturity} }
        ) {
          timestamp
          maturity
          unassignedEarnings
        }
      `
        )
        .join('')}
    }
  `,
    { market, ...timeWindow }
  )) as {
    initial: MarketState[];
    final: MarketState[];
    initialAccumulatorAccrual: State[];
    finalAccumulatorAccrual: State[];
    earningsAccumulatorSmoothFactor: { earningsAccumulatorSmoothFactor: string }[];
    initialDebtUpdate: FloatingDebtState[];
    finalDebtUpdate: FloatingDebtState[];
    interestRateModel: InterestRateModel[];
    treasuryFeeRate: { treasuryFeeRate: string }[];
  };

  const fixedPools = (prefix: string) =>
    Object.entries(allMaturities)
      .filter(([key, pools]: [string, FixedPool[]]) => pools.length && key.startsWith(prefix))
      .map(([, [pool]]: [string, FixedPool[]]) => pool);

  const initialShares = BigInt(initial.floatingDepositShares);
  const initialAssets = totalAssets(
    timeWindow.start,
    initial,
    initialAccumulatorAccrual,
    fixedPools('initial'),
    earningsAccumulatorSmoothFactor,
    initialDebtUpdate,
    interestRateModel,
    treasuryFeeRate
  );

  const finalShares = BigInt(final.floatingDepositShares);
  const finalAssets = totalAssets(
    timeWindow.end,
    final,
    finalAccumulatorAccrual,
    fixedPools('final'),
    earningsAccumulatorSmoothFactor,
    finalDebtUpdate,
    interestRateModel,
    treasuryFeeRate
  );

  const denominator = initialShares ? (initialAssets * WAD) / initialShares : WAD;
  const result = (((finalAssets * WAD) / finalShares) * WAD) / denominator;
  const time = 31_536_000 / (timeWindow.end - timeWindow.start);
  return ((Number(formatFixed(result, 18)) ** time - 1) * 100).toFixed(2);
};
