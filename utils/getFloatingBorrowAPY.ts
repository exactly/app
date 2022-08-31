import request from 'graphql-request';
import { formatFixed } from '@ethersproject/bignumber';
import type { FloatingDebtState, InterestRateModel, MarketState } from './floatingAPY';
import {
  DEFAULT_MARKET_STATE,
  DEFAULT_FLOATING_DEBT_STATE,
  totalFloatingBorrowAssets,
  WAD
} from './floatingAPY';

export default async (market: string, SUBGRAPH_URL: string) => {
  const timeWindow = {
    start: Math.floor(Date.now() / 1_000) - 3_600,
    end: Math.floor(Date.now() / 1_000)
  };
  const {
    initial: [initial = DEFAULT_MARKET_STATE],
    final: [final = initial],
    initialDebtUpdate: [initialDebtUpdate = DEFAULT_FLOATING_DEBT_STATE],
    finalDebtUpdate: [finalDebtUpdate = initialDebtUpdate],
    interestRateModel: [interestRateModel]
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
    }
  `,
    { market, ...timeWindow }
  )) as {
    initial: MarketState[];
    final: MarketState[];
    initialDebtUpdate: FloatingDebtState[];
    finalDebtUpdate: FloatingDebtState[];
    interestRateModel: InterestRateModel[];
  };

  const initialShares = BigInt(initial.floatingBorrowShares);
  const initialAssets = totalFloatingBorrowAssets(
    timeWindow.start,
    initial,
    initialDebtUpdate,
    interestRateModel
  );

  const finalShares = BigInt(final.floatingBorrowShares);
  const finalAssets = totalFloatingBorrowAssets(
    timeWindow.end,
    final,
    finalDebtUpdate,
    interestRateModel
  );

  const denominator = initialShares ? (initialAssets * WAD) / initialShares : WAD;
  const result = (((finalAssets * WAD) / finalShares) * WAD) / denominator;
  const time = 31_536_000 / (timeWindow.end - timeWindow.start);
  return ((Number(formatFixed(result, 18)) ** time - 1) * 100).toFixed(2);
};
