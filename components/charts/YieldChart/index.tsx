import { Box, Checkbox, FormControlLabel, Typography, useTheme } from '@mui/material';
import React, { FC, useCallback, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';
import { ResponsiveContainer, XAxis, Tooltip, ReferenceLine, AreaChart, Area, CartesianGrid, YAxis } from 'recharts';
import useAssets from 'hooks/useAssets';
import useYieldRates from 'hooks/useYieldRates';
import parseTimestamp from 'utils/parseTimestamp';
import { toPercentage } from 'utils/utils';
import ButtonsChart from '../ButtonsChart';
import LoadingChart from '../LoadingChart';
import TooltipChart from '../TooltipChart';
import { useTranslation } from 'react-i18next';

const getReferenceLines = () => {
  const data = [];
  let now = new Date().getTime() / 1000;
  const monthInSeconds = 30 * 86_400;

  for (let i = 1; i <= 3; i++) {
    data.push(now + monthInSeconds);
    now += monthInSeconds;
  }

  return data;
};

type Props = {
  symbol: string;
};

const YieldChart: FC<Props> = ({ symbol }) => {
  const { t } = useTranslation();
  const { palette, typography } = useTheme();
  const { depositsRates, borrowsRates, loading } = useYieldRates(symbol);
  const assets = useAssets();
  const [operation, setOperation] = useState<'Deposits' | 'Borrows'>('Borrows');
  const [showComparison, setShowComparison] = useState<boolean>(false);

  const filteredAssets = useMemo(
    () => (showComparison ? assets : assets.filter((asset) => asset === symbol)),
    [assets, showComparison, symbol],
  );

  const referenceLabel = useCallback(
    (timestamp: number) => {
      dayjs.extend(relativeTime);
      dayjs.extend(updateLocale);
      dayjs.updateLocale('en', {
        relativeTime: {
          M: t('1 month'),
          MM: t('%d months'),
          y: t('%d months'),
        },
      });

      return dayjs(timestamp * 1000).fromNow(true);
    },
    [t],
  );

  const buttons = useMemo(
    () => [
      {
        label: t('DEPOSIT APR'),
        onClick: () => setOperation('Deposits'),
      },
      {
        label: t('BORROW APR'),
        onClick: () => setOperation('Borrows'),
      },
    ],
    [t],
  );

  const formatTimestamp = useCallback((value: string | number) => parseTimestamp(value, 'MMM DD'), []);
  const formatTimestampLabel = useCallback((value: string | number) => `${parseTimestamp(value)}`, []);
  const formatPercentage = useCallback((value: number) => toPercentage(value as number), []);

  const onShowComparisonChange = useCallback(() => {
    setShowComparison((prev) => !prev);
  }, []);

  return (
    <Box display="flex" flexDirection="column" width="100%" height="100%" gap={2}>
      <Box display="flex" justifyContent="space-between">
        <Typography variant="h6" fontSize="16px">
          {t('Current Yield Curves')}
        </Typography>
        <Box>
          <ButtonsChart buttons={buttons} defaultSelected={1} />
        </Box>
      </Box>

      <ResponsiveContainer width="100%" height="100%">
        {loading ? (
          <LoadingChart />
        ) : (
          <AreaChart data={operation === 'Deposits' ? depositsRates : borrowsRates}>
            <XAxis
              dataKey="maturity"
              type="number"
              stroke="#8f8c9c"
              interval={0}
              padding={{ left: 20, right: 20 }}
              tickFormatter={formatTimestamp}
              domain={[(dataMin: number) => dataMin - 3_600 * 24 * 2, (dataMax: number) => dataMax + 3_600 * 24 * 2]}
              scale="time"
              tick={{ fill: palette.grey[500], fontWeight: 500, fontSize: 11 }}
              allowDataOverflow
              fontSize="12px"
              height={20}
            />
            <YAxis
              tickFormatter={formatPercentage}
              yAxisId="yaxis"
              axisLine={false}
              tick={{ fill: palette.grey[500], fontWeight: 500, fontSize: 11 }}
              tickLine={false}
              width={50}
            />
            <Tooltip
              formatter={(value) => toPercentage(value as number)}
              labelFormatter={formatTimestampLabel}
              content={<TooltipChart />}
            />
            <CartesianGrid stroke={palette.grey[300]} vertical={false} />
            {filteredAssets.map((asset, i) => (
              <Area
                key={asset}
                type="monotone"
                yAxisId="yaxis"
                dataKey={asset}
                stroke={palette.colors[i] || palette.grey[500]}
                strokeWidth={2}
                fillOpacity={0}
              />
            ))}
            {getReferenceLines().map((reference) => (
              <ReferenceLine
                ifOverflow="extendDomain"
                key={reference}
                yAxisId="yaxis"
                strokeDasharray="3 3"
                x={reference}
                label={{
                  value: referenceLabel(reference),
                  fontSize: 14,
                  fontFamily: typography.fontFamilyMonospaced,
                  fill: palette.grey[400],
                  position: 'insideTop',
                }}
                stroke={palette.grey[400]}
              />
            ))}
          </AreaChart>
        )}
      </ResponsiveContainer>
      <Box display="flex" alignItems="center" mt={-2.5} pl={1}>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              onChange={onShowComparisonChange}
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
              {t('Compare with other yield curves')}
            </Typography>
          }
        />
      </Box>
    </Box>
  );
};

export default React.memo(YieldChart);
