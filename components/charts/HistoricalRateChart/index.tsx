import { Box, Typography } from '@mui/material';
import useHistoricalRates from 'hooks/useHistoricalRates';
import React, { FC, useMemo } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ButtonsChart from '../ButtonsChart';
import LoadingChart from '../LoadingChart';

type Props = {
  symbol: string;
};

const HistoricalRateChart: FC<Props> = ({ symbol }) => {
  const { loading, rates, getRates } = useHistoricalRates(symbol);

  const buttons = useMemo(
    () => [
      {
        label: '1W',
        onClick: () => getRates(30, 3_600 * 6),
      },
      {
        label: '1M',
        onClick: () => getRates(30, 3_600 * 24),
      },
      {
        label: '3M',
        onClick: () => getRates(90, 3_600),
      },
    ],
    [getRates],
  );

  return (
    <Box display="flex" flexDirection="column" width="100%" height="100%" gap={2}>
      <Box display="flex" justifyContent="space-between">
        <Typography variant="h6">Historical Rates</Typography>
        <Box>
          <ButtonsChart buttons={buttons} />
        </Box>
      </Box>
      <ResponsiveContainer width="100%" height="100%">
        {loading ? (
          <LoadingChart />
        ) : (
          <LineChart data={rates} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="depositApr" stroke="#8884d8" activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="borrowApr" stroke="#82ca9d" />
          </LineChart>
        )}
      </ResponsiveContainer>
    </Box>
  );
};

export default React.memo(HistoricalRateChart);
