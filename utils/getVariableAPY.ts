import fetch from 'cross-fetch';
import { ApolloClient, HttpLink, InMemoryCache, gql as gqld } from '@apollo/client/core';
import { ethers } from 'ethers';

async function getVariableAPY(market: string, subgraphUrl: string, decimals: number) {
  const WAD = 1000000000000000000n;
  const INTERVAL = 86400 * 7 * 4;
  const MAX_FUTURE_POOLS = 3;

  const now = () => Math.floor(Date.now() / 1000);

  const futurePools = (start = now(), n = MAX_FUTURE_POOLS, interval = INTERVAL) =>
    [...new Array(n)].map((_, i) => start - (start % interval) + interval * (i + 1));

  // const start = now() - 86400 * 4;

  const timeWindow = {
    start: now() - 86400 * 7,
    end: now()
  };

  return new ApolloClient({
    link: new HttpLink({ uri: subgraphUrl, fetch }),
    cache: new InMemoryCache(),
    defaultOptions: { query: { fetchPolicy: 'no-cache' } }
  })
    .query({
      variables: { market: market, start: timeWindow.start },
      query: gqld`
      query GetAPY(
        $market: Bytes
        $start: Int
      ) {
        initial: marketUpdateds(
          first: 1
          orderBy: timestamp
          orderDirection: desc
          where: { market: $market, timestamp_lte: $start }
        ) {
          timestamp
          smartPoolShares
          smartPoolAssets
          smartPoolEarningsAccumulator
        }
        final: marketUpdateds(
          first: 1
          orderBy: timestamp
          orderDirection: desc
          where: { market: $market }
        ) {
          timestamp
          smartPoolShares
          smartPoolAssets
          smartPoolEarningsAccumulator
        }
        initialAccumulatedEarningsAccrual: marketUpdateds(
          first: 1
          orderBy: timestamp
          orderDirection: desc
          where: { market: $market, maturity: 0, timestamp_lte: $start }
        ) {
          timestamp
        }
        finalAccumulatedEarningsAccrual: marketUpdateds(
          first: 1
          orderBy: timestamp
          orderDirection: desc
          where: { market: $market, maturity: 0 }
        ) {
          timestamp
        }
        accumulatedEarningsSmoothFactor: accumulatedEarningsSmoothFactorSets(
          first: 1
          orderBy: timestamp
          orderDirection: desc
          where: { market: $market }
        ) {
          accumulatedEarningsSmoothFactor
        }
        ${futurePools(timeWindow.start)
          .map(
            (maturity) => `
          initial${maturity}: marketUpdateds(
            first: 1
            orderBy: timestamp
            orderDirection: desc
            where: { market: $market, maturity: ${maturity}, timestamp_lte: $start }
          ) {
            timestamp
            maturity
            maturityUnassignedEarnings
          }
        `
          )
          .join('')}
        ${futurePools(timeWindow.end)
          .map(
            (maturity) => `
          final${maturity}: marketUpdateds(
            first: 1
            orderBy: timestamp
            orderDirection: desc
            where: { market: $market, maturity: ${maturity} }
          ) {
            timestamp
            maturity
            maturityUnassignedEarnings
          }
        `
          )
          .join('')}
      }`
    })
    .then(
      ({
        data: {
          initial: [
            initial = {
              timestamp: 0,
              smartPoolShares: '0',
              smartPoolAssets: '0',
              smartPoolEarningsAccumulator: '0'
            }
          ],
          final: [final = initial],
          initialAccumulatedEarningsAccrual: [initialAccumulatedEarningsAccrual = { timestamp: 0 }],
          finalAccumulatedEarningsAccrual: [finalAccumulatedEarningsAccrual = { timestamp: 0 }],
          accumulatedEarningsSmoothFactor: [accumulatedEarningsSmoothFactor],
          ...allMaturities
        }
      }) => {
        const fixedPools = (prefix: string) =>
          Object.entries(allMaturities)
            //@ts-expect-error
            .filter(([key, res]: [string, [any]]) => res.length && key.startsWith(prefix))
            //@ts-expect-error
            .map(([, [fixedPool]]: [string, [any]]) => fixedPool);
        const totalAssets = (
          timestamp: number,
          marketState: {
            smartPoolAssets: string;
            smartPoolEarningsAccumulator: string;
          },
          accumulatedEarningsAccrual: { timestamp: number },
          maturities: { timestamp: number; maturity: number; maturityUnassignedEarnings: string }[]
        ) => {
          const elapsed = BigInt(timestamp - accumulatedEarningsAccrual.timestamp);
          return (
            BigInt(marketState.smartPoolAssets) +
            maturities.reduce((smartPoolEarnings, fixedPool) => {
              const { timestamp: lastAccrual, maturity, maturityUnassignedEarnings } = fixedPool;
              return smartPoolEarnings + BigInt(maturityUnassignedEarnings);
              return (
                smartPoolEarnings +
                (maturity > lastAccrual
                  ? (BigInt(maturityUnassignedEarnings) * BigInt(timestamp - lastAccrual)) /
                    BigInt(maturity - lastAccrual)
                  : 0n)
              );
            }, 0n) +
            (elapsed &&
              (BigInt(marketState.smartPoolEarningsAccumulator) * elapsed) /
                (elapsed +
                  (BigInt(accumulatedEarningsSmoothFactor.accumulatedEarningsSmoothFactor) *
                    BigInt(MAX_FUTURE_POOLS * INTERVAL)) /
                    WAD))
          );
        };

        const initialShares = BigInt(initial.smartPoolShares);
        const initialAssets = totalAssets(
          timeWindow.start,
          initial,
          initialAccumulatedEarningsAccrual,
          fixedPools('initial')
        );

        const finalShares = BigInt(final.smartPoolShares);
        const finalAssets = totalAssets(
          timeWindow.end,
          final,
          finalAccumulatedEarningsAccrual,
          fixedPools('final')
        );

        const denominatorFallback = initialShares ? (initialAssets * WAD) / initialShares : WAD;

        const result = (((finalAssets * WAD) / finalShares) * WAD) / denominatorFallback;

        const parsedResult = ethers.utils.formatUnits(result, 18);
        let forTheDemo = parsedResult;

        if (parseFloat(parsedResult) < 1) {
          forTheDemo = '1.0006';
        }

        const time = 31536000 / (timeWindow.end - timeWindow.start);

        const APY = ((Math.pow(parseFloat(forTheDemo), time) - 1) / 2) * 100;

        return APY.toFixed(2);
      }
    );
}

export default getVariableAPY;
