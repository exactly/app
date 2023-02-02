import { Box, Typography, useTheme } from '@mui/material';
import React, { FC, useMemo, useState } from 'react';
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

const referenceLabel = (t: number) => {
  dayjs.extend(relativeTime);
  dayjs.extend(updateLocale);
  dayjs.updateLocale('en', {
    relativeTime: {
      M: '1 month',
      MM: '%d months',
      y: '%d months',
    },
  });

  return dayjs(t * 1000).fromNow(true);
};

type Props = {
  symbol?: string;
};

const YieldChart: FC<Props> = ({ symbol }) => {
  const { depositsRates, borrowsRates, loading } = useYieldRates(symbol);
  const [operation, setOperation] = useState<'Deposits' | 'Borrows'>('Borrows');
  const assets = useAssets();
  const { palette, typography } = useTheme();

  const buttons = useMemo(
    () => [
      {
        label: 'DEPOSIT APR',
        onClick: () => setOperation('Deposits'),
      },
      {
        label: 'BORROW APR',
        onClick: () => setOperation('Borrows'),
      },
    ],
    [],
  );

  return (
    <Box display="flex" flexDirection="column" width="100%" height="100%" gap={2}>
      <Box display="flex" justifyContent="space-between">
        <Typography variant="h6" fontSize="16px">
          Current Yield Curves
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
              tickMargin={16}
              interval={0}
              padding={{ left: 20, right: 20 }}
              tickFormatter={(t) => parseTimestamp(t, 'MMM DD')}
              domain={[(dataMin: number) => dataMin - 3_600 * 24 * 2, (dataMax: number) => dataMax + 3_600 * 24 * 2]}
              scale="time"
              tick={{ fill: palette.grey[500], fontWeight: 500, fontSize: 12 }}
              allowDataOverflow
              fontSize="12px"
            />
            <YAxis
              tickFormatter={(t) => toPercentage(t)}
              yAxisId="yaxis"
              axisLine={false}
              tick={{ fill: palette.grey[500], fontWeight: 500, fontSize: 12 }}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => toPercentage(value as number)}
              labelFormatter={(value) => `${parseTimestamp(value)}`}
              content={<TooltipChart />}
            />
            <CartesianGrid stroke={palette.grey[300]} vertical={false} />
            {assets.map((asset) => (
              <Area
                key={asset}
                type="monotone"
                yAxisId="yaxis"
                dataKey={asset}
                stroke={palette.symbol[asset] || palette.grey[500]}
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
    </Box>
  );
};

export default React.memo(YieldChart);
