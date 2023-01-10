import { Box, Typography } from '@mui/material';
import React, { FC } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';
import { ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine, AreaChart, Area } from 'recharts';
import useAssets from 'hooks/useAssets';
import useYieldRates from 'hooks/useYieldRates';
import parseTimestamp from 'utils/parseTimestamp';
import { toPercentage } from 'utils/utils';

type Props = {
  symbol?: string;
};

const getRandomColor = () => {
  return '#' + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, '0');
};

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
  return parseTimestamp(tick);
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
  const { depositsRates } = useYieldRates();

  const assets = useAssets();

  return (
    <Box display="flex" flexDirection="column" width="100%" height="100%" gap={2}>
      <Box display="flex" justifyContent="space-between">
        <Typography variant="h6">Yield Curve</Typography>
      </Box>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={depositsRates}>
          <XAxis
            dataKey="maturity"
            type="number"
            stroke="#8f8c9c"
            tickMargin={16}
            tickFormatter={(t) => formatXAxis(t)}
            domain={['dataMin', 'dataMax']}
            scale="time"
          />
          <YAxis tickFormatter={(value) => toPercentage(value as number)} type="number" tickLine={false} />
          <Tooltip
            formatter={(value) => toPercentage(value as number)}
            labelFormatter={(value) => {
              return `${parseTimestamp(value)}`;
            }}
          />
          {assets.map((asset) => (
            <Area key={asset} type="monotone" dataKey={asset} stroke={getRandomColor()} fillOpacity={0} />
          ))}
          {getReferenceLines().map((reference) => (
            <ReferenceLine key={reference} x={reference} label={referenceLabel(reference)} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default React.memo(YieldChart);
