import { Box, Typography, useTheme } from '@mui/material';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toPercentage } from 'utils/utils';
import { useStakedEXAChart } from 'hooks/useStakedEXA';

import LoadingChart from 'components/charts/LoadingChart';
import TooltipChart from 'components/charts/TooltipChart';

const StakeChart = () => {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const data = useStakedEXAChart();

  const loading = false;

  const formatDate = useCallback((date: Date, year?: boolean) => {
    return date.toLocaleDateString('en-us', { year: year ? 'numeric' : undefined, month: 'short', day: '2-digit' });
  }, []);

  const now = Math.floor(Date.now() / 1000);

  return (
    <Box
      p={4}
      borderRadius="16px"
      bgcolor="components.bg"
      boxShadow={() => (palette.mode === 'light' ? '0px 6px 10px 0px rgba(97, 102, 107, 0.20)' : '')}
      display="flex"
      height={400}
    >
      <Box display="flex" flexDirection="column" width="100%" height="100%" gap={2}>
        <Box display="flex" justifyContent="space-between">
          <Typography variant="h6" fontSize="16px">
            {t('Staking')}
          </Typography>
        </Box>
        <ResponsiveContainer width="100%" height="100%">
          {loading ? (
            <LoadingChart />
          ) : (
            <LineChart data={data} margin={{ top: 5, bottom: 5 }}>
              <CartesianGrid horizontal vertical={false} stroke={palette.grey[300]} />
              <XAxis
                xAxisId="date"
                dataKey="date"
                type="number"
                domain={['dataMin', 'dataMax']}
                minTickGap={50}
                padding={{ left: 20, right: 30 }}
                tickFormatter={(value) => formatDate(new Date((value * 1000) as number))}
                stroke="#B4BABF"
                fontSize="12px"
                height={20}
              />
              <YAxis
                yAxisId="left"
                tickFormatter={(tick) => toPercentage(tick)}
                axisLine={false}
                tick={{ fill: palette.grey[500], fontWeight: 500, fontSize: 11 }}
                tickLine={false}
                width={50}
              />
              <Tooltip
                labelFormatter={(value) => formatDate(new Date((value * 1000) as number))}
                formatter={(value) => toPercentage(value as number)}
                content={<TooltipChart itemSorter={(a, b) => (a.value > b.value ? -1 : 1)} />}
              />
              <Line
                yAxisId="left"
                xAxisId="date"
                type="monotone"
                dataKey="value"
                name={t('Discount Factor')}
                stroke={palette.mode === 'light' ? 'black' : 'white'}
                dot={false}
                strokeWidth={2}
              />
              <ReferenceLine xAxisId="date" yAxisId="left" x={now} stroke="red" strokeDasharray="3 3" />
            </LineChart>
          )}
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default React.memo(StakeChart);
