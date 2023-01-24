import { Box, Typography, useTheme } from '@mui/material';
import React, { FC, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';
import { ResponsiveContainer, XAxis, Tooltip, ReferenceLine, AreaChart, Area, CartesianGrid } from 'recharts';
import useAssets from 'hooks/useAssets';
import useYieldRates from 'hooks/useYieldRates';
import parseTimestamp from 'utils/parseTimestamp';
import { toPercentage } from 'utils/utils';
import ButtonsChart from '../ButtonsChart';
import LoadingChart from '../LoadingChart';
import TooltipChart from '../TooltipChart';

type Props = {
  symbol?: string;
};

// const getRandomColor = () => {
//   return '#' + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, '0');
// };

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

const formatXAxis = (tick: number) => {
  return parseTimestamp(tick, 'MMM DD');
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

const YieldChart: FC<Props> = () => {
  const { depositsRates, borrowsRates, loading } = useYieldRates();
  const [operation, setOperation] = useState<'Deposits' | 'Borrows'>('Deposits');
  const assets = useAssets();
  const { palette, typography } = useTheme();

  const buttons = useMemo(
    () => [
      {
        label: 'DEPOSITS',
        onClick: () => setOperation('Deposits'),
      },
      {
        label: 'BORROWS',
        onClick: () => setOperation('Borrows'),
      },
    ],
    [],
  );

  return (
    <Box display="flex" flexDirection="column" width="100%" height="100%" gap={2}>
      <Box display="flex" justifyContent="space-between">
        <Typography variant="h6" fontSize="16px">
          Yield curve
        </Typography>
        <Box>
          <ButtonsChart buttons={buttons} />
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
              tickFormatter={(t) => formatXAxis(t)}
              domain={[(dataMin: number) => dataMin - 3600 * 24 * 2, (dataMax: number) => dataMax + 3600 * 24 * 2]}
              scale="time"
              tick={{ fill: palette.grey[500], fontWeight: 500, fontSize: 12 }}
              allowDataOverflow
              fontSize="12px"
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
                dataKey={asset}
                stroke={palette.symbol[asset as 'WETH' | 'DAI' | 'USDC' | 'WBTC' | 'wstETH']}
                strokeWidth={2}
                fillOpacity={0}
              />
            ))}
            {getReferenceLines().map((reference) => (
              <ReferenceLine
                alwaysShow
                key={reference}
                x={reference}
                label={{ value: referenceLabel(reference), fontSize: 14, fontFamily: typography.fontFamilyMonospaced }}
              />
            ))}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </Box>
  );
};

export default React.memo(YieldChart);
