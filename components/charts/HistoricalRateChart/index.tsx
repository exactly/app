import { Box, Checkbox, FormControlLabel, Typography, useTheme } from '@mui/material';
import useHistoricalRates from 'hooks/useHistoricalRates';
import React, { FC, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toPercentage } from 'utils/utils';
import ButtonsChart from '../ButtonsChart';
import LoadingChart from '../LoadingChart';
import TooltipChart from '../TooltipChart';
import { track } from '../../../utils/segment';

type Props = {
  symbol: string;
};

const HistoricalRateChart: FC<Props> = ({ symbol }) => {
  const { t } = useTranslation();
  const [showUtilization, setShowUtilization] = useState(false);
  const { palette } = useTheme();
  const { loading, rates, getRates } = useHistoricalRates(symbol);

  const sortedRates = useMemo(() => rates.sort((a, b) => (a.date > b.date ? 1 : -1)), [rates]);

  const buttons = useMemo(
    () => [
      {
        label: t('1W'),
        onClick: () => getRates(30, 3_600 * 6),
      },
      {
        label: t('1M'),
        onClick: () => getRates(30, 3_600 * 24),
      },
      {
        label: t('3M'),
        onClick: () => getRates(90, 3_600 * 24),
      },
    ],
    [getRates, t],
  );

  const formatDate = useCallback((date: Date, year?: boolean) => {
    return date.toLocaleDateString('en-us', { year: year ? 'numeric' : undefined, month: 'short', day: '2-digit' });
  }, []);

  const onShowUtilizationChange = useCallback(() => {
    setShowUtilization((prev) => !prev);
    track('Toggle Clicked', {
      name: 'show utilization',
      location: 'Historical Rate Chart',
      symbol,
      value: !showUtilization,
    });
  }, [showUtilization, symbol]);

  return (
    <Box display="flex" flexDirection="column" width="100%" height="100%" gap={2}>
      <Box display="flex" justifyContent="space-between">
        <Typography variant="h6" fontSize="16px">
          {t('Historical Variable Rates')}
        </Typography>
        <Box>
          <ButtonsChart buttons={buttons} />
        </Box>
      </Box>
      <ResponsiveContainer width="100%" height="100%">
        {loading ? (
          <LoadingChart />
        ) : (
          <LineChart data={sortedRates} margin={{ top: 5, bottom: 5 }}>
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
              tickFormatter={(tick) => toPercentage(tick)}
              axisLine={false}
              tick={{ fill: palette.grey[500], fontWeight: 500, fontSize: 11 }}
              tickLine={false}
              width={50}
            />
            {showUtilization && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => `${((value as number) * 100).toFixed(2)}%`}
                tick={{ fill: palette.blue, fontWeight: 500, fontSize: 11 }}
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
              name={t('Deposit APR')}
              stroke={palette.mode === 'light' ? 'black' : 'white'}
              dot={false}
              strokeWidth={2}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="borrowApr"
              name={t('Borrow APR')}
              stroke={palette.green}
              dot={false}
              strokeWidth={2}
            />
            {showUtilization && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="utilization"
                name={t('Utilization Rate')}
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
              {t('Show utilization')}
            </Typography>
          }
        />
      </Box>
    </Box>
  );
};

export default React.memo(HistoricalRateChart);
