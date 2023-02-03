import { Box, Checkbox, FormControlLabel, Typography, useTheme } from '@mui/material';
import useHistoricalRates from 'hooks/useHistoricalRates';
import React, { FC, useCallback, useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toPercentage } from 'utils/utils';
import ButtonsChart from '../ButtonsChart';
import LoadingChart from '../LoadingChart';
import TooltipChart from '../TooltipChart';

type Props = {
  symbol: string;
};

const HistoricalRateChart: FC<Props> = ({ symbol }) => {
  const [showUtilization, setShowUtilization] = useState(false);
  const { palette } = useTheme();
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

  const formatDate = useCallback((date: Date, year?: boolean) => {
    return date.toLocaleDateString('en-us', { year: year ? 'numeric' : undefined, month: 'short', day: '2-digit' });
  }, []);

  const onShowUtilizationChange = useCallback(() => {
    setShowUtilization((prev) => !prev);
  }, []);

  return (
    <Box display="flex" flexDirection="column" width="100%" height="100%" gap={2}>
      <Box display="flex" justifyContent="space-between">
        <Typography variant="h6" fontSize="16px">
          Historical Variable Rates
        </Typography>
        <Box>
          <ButtonsChart buttons={buttons} />
        </Box>
      </Box>
      <ResponsiveContainer width="100%" height="100%">
        {loading ? (
          <LoadingChart />
        ) : (
          <LineChart data={rates} margin={{ top: 5, bottom: 5 }}>
            <CartesianGrid horizontal vertical={false} stroke={palette.grey[300]} />
            <XAxis
              minTickGap={50}
              padding={{ left: 20, right: 30 }}
              dataKey="date"
              tickFormatter={(value) => (value instanceof Date ? formatDate(value as Date) : '')}
              stroke="#B4BABF"
              fontSize="12px"
              height={20}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={(t) => toPercentage(t)}
              axisLine={false}
              tick={{ fill: palette.grey[500], fontWeight: 500, fontSize: 12 }}
              tickLine={false}
              width={50}
            />
            {showUtilization && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => `${((value as number) * 100).toFixed(2)}%`}
                tick={{ fill: palette.blue, fontWeight: 500, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
            )}
            <Tooltip
              labelFormatter={(value) => (value instanceof Date ? formatDate(value as Date, true) : '')}
              formatter={(value) => toPercentage(value as number)}
              content={<TooltipChart itemSorter={(a, b) => (a.value > b.value ? -1 : 1)} />}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="depositApr"
              name="Deposit APR"
              stroke="black"
              dot={false}
              strokeWidth={2}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="borrowApr"
              name="Borrow APR"
              stroke={palette.green}
              dot={false}
              strokeWidth={2}
            />
            {showUtilization && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="utilization"
                name="Utilization Rate"
                stroke={palette.blue}
                dot={false}
                strokeDasharray="5 5"
              />
            )}
          </LineChart>
        )}
      </ResponsiveContainer>
      <Box display="flex" alignItems="center" mt={-2.5} pl={1}>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              onChange={onShowUtilizationChange}
              sx={{
                color: palette.blue,
                '&.Mui-checked': {
                  color: palette.blue,
                },
              }}
            />
          }
          label={
            <Typography variant="subtitle1" fontSize="12px">
              Show utilization
            </Typography>
          }
        />
      </Box>
    </Box>
  );
};

export default React.memo(HistoricalRateChart);
