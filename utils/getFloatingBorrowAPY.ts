// import request from 'graphql-request';
// import { formatFixed } from '@ethersproject/bignumber';
// import { lnWad, WAD } from './fixedPointMathLib';

// const min = (a: bigint, b: bigint) => (a < b ? a : b);
// const max = (a: bigint, b: bigint) => (a > b ? a : b);

// export default async (market: string, subgraphUrl: string) => {
//   const timeWindow = {
//     start: Math.floor(Date.now() / 1_000) - 3_600 * 24,
//     // start: Math.max(Math.floor(Date.now() / 1_000) - 86_400 * 7, 1_660_170_000),
//     end: Math.floor(Date.now() / 1_000)
//   };

//   const {
//     initial: [
//       initial = {
//         timestamp: 0,
//         floatingAssets: '0',
//         floatingBorrowShares: '0',
//         floatingDebt: '0'
//       }
//     ],
//     final: [final = initial],
//     initialDebtUpdate: [initialDebtUpdate = { timestamp: 0, utilization: '0' }],
//     finalDebtUpdate: [finalDebtUpdate = initialDebtUpdate],
//     floatingParameters: [{ curveA, curveB, maxUtilization, fullUtilization }]
//   } = (await request(
//     subgraphUrl,
//     `
//     query(
//       $market: Bytes
//       $start: Int
//     ) {
//       initial: marketUpdates(
//         first: 1
//         orderBy: timestamp
//         orderDirection: desc
//         where: { market: $market, timestamp_lte: $start }
//       ) {
//         timestamp
//         floatingAssets
//         floatingBorrowShares
//         floatingDebt
//       }
//       final: marketUpdates(
//         first: 1
//         orderBy: timestamp
//         orderDirection: desc
//         where: { market: $market }
//       ) {
//         timestamp
//         floatingAssets
//         floatingBorrowShares
//         floatingDebt
//       }
//       initialDebtUpdate: floatingDebtUpdates(
//         first: 1
//         orderBy: timestamp
//         orderDirection: desc
//         where: { market: $market, timestamp_lte: $start }
//       ) {
//         timestamp
//         utilization
//       }
//       finalDebtUpdate: floatingDebtUpdates(
//         first: 1
//         orderBy: timestamp
//         orderDirection: desc
//         where: { market: $market }
//       ) {
//         timestamp
//         utilization
//       }
//       floatingParameters: floatingParametersSets(
//         first: 1
//         orderBy: timestamp
//         orderDirection: desc
//       ) {
//         curveA
//         curveB
//         maxUtilization
//         fullUtilization
//       }
//     }
//   `,
//     { market, ...timeWindow }
//   )) as {
//     initial: MarketState[];
//     final: MarketState[];
//     initialDebtUpdate: FloatingDebtState[];
//     finalDebtUpdate: FloatingDebtState[];
//     floatingParameters: IRMParameters[];
//   };

//   const floatingRate = (utilizationBefore: bigint, utilizationAfter: bigint) =>
//     (BigInt(utilizationAfter) - BigInt(utilizationBefore) < 2_500_000_000n
//       ? (BigInt(curveA) * WAD) / (BigInt(maxUtilization) - BigInt(utilizationBefore))
//       : (BigInt(curveA) *
//           lnWad(
//             ((BigInt(maxUtilization) - BigInt(utilizationBefore)) * WAD) /
//               (BigInt(maxUtilization) - BigInt(utilizationAfter))
//           )) /
//         (BigInt(utilizationAfter) - BigInt(utilizationBefore))) + BigInt(curveB);

//   const totalAssets = (
//     timestamp: number,
//     { floatingAssets, floatingDebt }: MarketState,
//     { timestamp: debtUpdate, utilization }: FloatingDebtState
//   ) => {
//     const newUtilization =
//       BigInt(floatingAssets) > 0n
//         ? (BigInt(floatingDebt) * WAD) / ((BigInt(floatingAssets) * WAD) / BigInt(fullUtilization))
//         : 0n;
//     const borrowRate = floatingRate(
//       min(BigInt(utilization), newUtilization),
//       max(BigInt(utilization), newUtilization)
//     );
//     return (
//       BigInt(floatingDebt) +
//       (BigInt(floatingDebt) * ((borrowRate * BigInt(timestamp - debtUpdate)) / 31_536_000n)) / WAD
//     );
//   };

//   try {
//     const initialShares = BigInt(initial.floatingBorrowShares);
//     const initialAssets = totalAssets(timeWindow.start, initial, initialDebtUpdate);

//     const finalShares = BigInt(final.floatingBorrowShares);
//     const finalAssets = totalAssets(timeWindow.end, final, finalDebtUpdate);

//     const denominator = initialShares ? (initialAssets * WAD) / initialShares : WAD;
//     const result = (((finalAssets * WAD) / finalShares) * WAD) / denominator;

//     const time = 31_536_000 / (timeWindow.end - timeWindow.start);

//     return ((Number(formatFixed(result, 18)) ** time - 1) * 100).toFixed(2);
//   } catch (e) {
//     return 'N/A';
//   }
// };

// interface State {
//   timestamp: number;
// }

// interface MarketState extends State {
//   floatingAssets: string;
//   floatingBorrowShares: string;
//   floatingDebt: string;
// }

// interface FloatingDebtState extends State {
//   utilization: string;
// }

// interface IRMParameters {
//   curveA: string;
//   curveB: string;
//   maxUtilization: string;
//   fullUtilization: string;
// }

import request from 'graphql-request';
import { formatFixed } from '@ethersproject/bignumber';
import type { FloatingDebtState, IRMParameters, MarketState } from './floatingAPY';
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
    floatingParameters: [floatingParameters]
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
      floatingParameters: floatingParametersSets(
        first: 1
        orderBy: timestamp
        orderDirection: desc
      ) {
        curveA
        curveB
        maxUtilization
        fullUtilization
      }
    }
  `,
    { market, ...timeWindow }
  )) as {
    initial: MarketState[];
    final: MarketState[];
    initialDebtUpdate: FloatingDebtState[];
    finalDebtUpdate: FloatingDebtState[];
    floatingParameters: IRMParameters[];
  };

  const initialShares = BigInt(initial.floatingBorrowShares);
  const initialAssets = totalFloatingBorrowAssets(
    timeWindow.start,
    initial,
    initialDebtUpdate,
    floatingParameters
  );

  const finalShares = BigInt(final.floatingBorrowShares);
  const finalAssets = totalFloatingBorrowAssets(
    timeWindow.end,
    final,
    finalDebtUpdate,
    floatingParameters
  );

  const denominator = initialShares ? (initialAssets * WAD) / initialShares : WAD;
  const result = (((finalAssets * WAD) / finalShares) * WAD) / denominator;
  const time = 31_536_000 / (timeWindow.end - timeWindow.start);
  return ((Number(formatFixed(result, 18)) ** time - 1) * 100).toFixed(2);
};
