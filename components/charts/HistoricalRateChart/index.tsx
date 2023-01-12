import { Box, Typography } from '@mui/material';
import useHistoricalRates from 'hooks/useHistoricalRates';
import React, { FC, useCallback, useMemo } from 'react';
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
        onClick: () => getRates(90, 3_600 * 24),
      },
    ],
    [getRates],
  );

  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString('en-us', { year: 'numeric', month: 'short', day: '2-digit' });
  }, []);

  return (
    <Box display="flex" flexDirection="column" width="100%" height="100%" gap={2}>
      <Box display="flex" justifyContent="space-between" mx={3}>
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
            <XAxis
              minTickGap={50}
              padding={{ left: 20, right: 50 }}
              dataKey="date"
              tickFormatter={(value) => (value instanceof Date ? formatDate(value as Date) : '')}
            />
            <YAxis
              label={{ value: 'APR', angle: -90, position: 'left' }}
              yAxisId="left"
              padding={{ top: 5, bottom: 5 }}
              tickFormatter={(value) => `${((value as number) * 100).toFixed(2)}%`}
            />
            <YAxis
              label={{ value: 'Utilization Rate', angle: -270, position: 'right' }}
              yAxisId="right"
              orientation="right"
              padding={{ top: 5, bottom: 5 }}
              tickFormatter={(value) => `${((value as number) * 100).toFixed(2)}%`}
            />
            <Tooltip
              labelFormatter={(value) => (value instanceof Date ? formatDate(value as Date) : '')}
              formatter={(value, name) => [`${((value as number) * 100).toFixed(2)}%`, name]}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="depositApr"
              name="Deposit APR"
              stroke="#8884d8"
              dot={false}
              strokeWidth={2}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="borrowApr"
              name="Borrow APR"
              stroke="#82ca9d"
              dot={false}
              strokeWidth={2}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="utilization"
              name="Utilization Rate"
              stroke="black"
              dot={false}
              strokeDasharray="5 5"
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </Box>
  );
};

export default React.memo(HistoricalRateChart);
