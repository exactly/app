import useHistoricalRatesData from 'hooks/useHistoricalRatesData';
import React, { FC } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import LoadingChart from '../LoadingChart';

type Props = {
  symbol: string;
};

const HistoricalRateChart: FC<Props> = ({ symbol }) => {
  const data = useHistoricalRatesData(symbol);

  return (
    <ResponsiveContainer width="100%" height="100%">
      {data ? (
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="depositApr" stroke="#8884d8" activeDot={{ r: 8 }} />
          <Line type="monotone" dataKey="borrowApr" stroke="#82ca9d" />
        </LineChart>
      ) : (
        <LoadingChart />
      )}
    </ResponsiveContainer>
  );
};

export default React.memo(HistoricalRateChart);
