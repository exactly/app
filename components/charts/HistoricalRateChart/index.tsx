import AccountDataContext from 'contexts/AccountDataContext';
import React, { FC, useCallback, useContext, useEffect, useState } from 'react';
import networkData from 'config/networkData.json' assert { type: 'json' };
import queryRates from 'utils/queryRates';
import { useWeb3 } from 'hooks/useWeb3';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Props = {
  symbol: string;
};

const HistoricalRateChart: FC<Props> = ({ symbol }) => {
  const { chain } = useWeb3();
  const { accountData } = useContext(AccountDataContext);
  const [data, setData] = useState<any>([]);

  const getRates = useCallback(
    async (type: 'borrow' | 'deposit') => {
      if (!accountData || !chain || !symbol) return [];

      const subgraphUrl = networkData[String(chain.id) as keyof typeof networkData]?.subgraph;
      if (!subgraphUrl) return [];

      const { market: marketAddress, maxFuturePools } = accountData[symbol];

      const rates = await queryRates(subgraphUrl, marketAddress, type, { maxFuturePools, interval: 86_400, count: 10 });
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

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="depositApr" stroke="#8884d8" activeDot={{ r: 8 }} />
        <Line type="monotone" dataKey="borrowApr" stroke="#82ca9d" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default React.memo(HistoricalRateChart);
