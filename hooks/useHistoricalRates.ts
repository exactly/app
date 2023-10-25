import { useCallback, useEffect, useState } from 'react';
import networkData from 'config/networkData.json' assert { type: 'json' };
import { useWeb3 } from './useWeb3';
import queryRates from 'utils/queryRates';
import { captureException } from '@sentry/nextjs';
import useAccountData from './useAccountData';
import { useGlobalError } from 'contexts/GlobalErrorContext';

type HistoricalRateData = {
  date: Date;
  depositApr: number;
  borrowApr: number;
  utilization: number;
};

// This is the maximum number of data points we can get from the subgraph
const MAX_COUNT = 24;
const emptyBatch: Awaited<ReturnType<typeof queryRates>> = [];

export default function useHistoricalRates(symbol: string, initialCount = 30, initialInterval = 3_600 * 6) {
  const { chain } = useWeb3();
  const { accountData, getMarketAccount } = useAccountData();
  const [loading, setLoading] = useState<boolean>(true);
  const [rates, setRates] = useState<HistoricalRateData[]>([]);
  const { setIndexerError } = useGlobalError();

  const getRatesBatch = useCallback(
    async (type: 'borrow' | 'deposit', count: number, interval: number, offset: number) => {
      if (!accountData || !chain) return emptyBatch;

      const subgraphUrl = networkData[String(chain.id) as keyof typeof networkData]?.subgraph.exactly;
      if (!subgraphUrl) return emptyBatch;

      const { market: marketAddress, maxFuturePools } = getMarketAccount(symbol) ?? {};
      if (!marketAddress || !maxFuturePools) return emptyBatch;

      try {
        return await queryRates(subgraphUrl, marketAddress, type, {
          maxFuturePools,
          roundTicks: true,
          interval,
          count,
          offset,
        });
      } catch (error) {
        setIndexerError();
        return emptyBatch;
      }
    },
    [accountData, chain, getMarketAccount, symbol, setIndexerError],
  );

  const getRates = useCallback(
    async (count: number, interval: number) => {
      setLoading(true);
      // We can only get 30 data points at a time, so we need to make multiple *concurrent* requests
      const iterations = Math.ceil(count / MAX_COUNT);

      try {
        const ratesBatched = await Promise.all(
          Array.from(Array(iterations).keys()).map(async (i) => {
            const depositAPRs = await getRatesBatch('deposit', Math.min(count, MAX_COUNT), interval, i * MAX_COUNT);
            const borrowAPRs = await getRatesBatch('borrow', Math.min(count, MAX_COUNT), interval, i * MAX_COUNT);
            return depositAPRs.map((d, j) => ({
              date: d.date,
              depositApr: d.apr,
              utilization: d.utilization,
              borrowApr: borrowAPRs[j].apr,
            }));
          }),
        );
        const rs = ratesBatched.reverse().flatMap((r) => r);
        if (rs.length === 0) {
          return;
        }
        setRates(ratesBatched.reverse().flatMap((r) => r));
        setLoading(false);
      } catch (error) {
        captureException(error);
      }
    },
    [getRatesBatch],
  );

  useEffect(() => {
    void getRates(initialCount, initialInterval);
  }, [getRates, initialCount, initialInterval]);

  return { loading, rates, getRates };
}
