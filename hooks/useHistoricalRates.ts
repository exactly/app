import { useCallback, useContext, useEffect, useState } from 'react';
import AccountDataContext from 'contexts/AccountDataContext';
import networkData from 'config/networkData.json' assert { type: 'json' };
import { useWeb3 } from './useWeb3';
import queryRates from 'utils/queryRates';
import { captureException } from '@sentry/nextjs';

type HistoricalRateData = {
  date: Date;
  depositApr: number;
  borrowApr: number;
  utilization: number;
};

// This is the maximum number of data points we can get from the subgraph
const MAX_COUNT = 24;

export default function useHistoricalRates(symbol: string, initialCount = 30, initialInterval = 3_600 * 6) {
  const { chain } = useWeb3();
  const { accountData } = useContext(AccountDataContext);
  const [loading, setLoading] = useState<boolean>(true);
  const [rates, setRates] = useState<HistoricalRateData[]>([]);

  const getRatesBatch = useCallback(
    async (type: 'borrow' | 'deposit', count: number, interval: number, offset: number) => {
      if (!accountData || !chain || !symbol) return [];

      const subgraphUrl = networkData[String(chain.id) as keyof typeof networkData]?.subgraph;
      if (!subgraphUrl) return [];

      const { market: marketAddress, maxFuturePools } = accountData[symbol];

      return await queryRates(subgraphUrl, marketAddress, type, {
        maxFuturePools,
        roundTicks: true,
        interval,
        count,
        offset,
      });
    },
    [accountData, chain, symbol],
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
        setRates(ratesBatched.reverse().flatMap((r) => r));
        setLoading(false);
      } catch (error) {
        captureException(error);
      }
    },
    [getRatesBatch],
  );

  useEffect(() => {
    if (!rates.length) {
      void getRates(initialCount, initialInterval);
    }
  }, [getRates, initialCount, initialInterval, rates]);

  return { loading, rates, getRates };
}
