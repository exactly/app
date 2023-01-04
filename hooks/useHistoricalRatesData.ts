import { useCallback, useContext, useEffect, useState } from 'react';
import AccountDataContext from 'contexts/AccountDataContext';
import networkData from 'config/networkData.json' assert { type: 'json' };
import { useWeb3 } from './useWeb3';
import queryRates from 'utils/queryRates';

type HistoricalRateData = {
  date: Date;
  depositApr: number;
  borrowApr: number;
};

export default function useHistoricalRatesData(symbol: string) {
  const { chain } = useWeb3();
  const { accountData } = useContext(AccountDataContext);
  const [data, setData] = useState<HistoricalRateData[]>([]);

  const getRates = useCallback(
    async (type: 'borrow' | 'deposit') => {
      if (!accountData || !chain || !symbol) return [];

      const subgraphUrl = networkData[String(chain.id) as keyof typeof networkData]?.subgraph;
      if (!subgraphUrl) return [];

      const { market: marketAddress, maxFuturePools } = accountData[symbol];

      const rates = await queryRates(subgraphUrl, marketAddress, type, { maxFuturePools, interval: 86_400, count: 30 });
      return rates;
    },
    [accountData, chain, symbol],
  );

  useEffect(() => {
    const getData = async () => {
      const depositAPRs = await getRates('deposit');
      const borrowAPRs = await getRates('borrow');

      const result = depositAPRs.map((d, i) => ({ date: d.date, depositApr: d.apr, borrowApr: borrowAPRs[i].apr }));
      setData(result);
    };
    void getData();
  }, [getRates]);

  return data;
}
