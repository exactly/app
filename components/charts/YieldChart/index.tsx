import { Box, Typography } from '@mui/material';
import React, { FC } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';
import { CartesianGrid, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import useAssets from 'hooks/useAssets';
import useYieldRates from 'hooks/useYieldRates';

type Props = {
  symbol?: string;
};

function formatXAxis(tick: number) {
  dayjs.extend(relativeTime);
  dayjs.extend(updateLocale);
  dayjs.updateLocale('en', {
    relativeTime: {
      M: '1 month',
      MM: '%d months',
      y: '%d months',
    },
  });

  const newTick = dayjs(tick * 1000).fromNow(true);

  return newTick;
}

const tick = {
  fontSize: '12px',
};

const ticks = getXAxisTicks();

function getXAxisTicks() {
  const data = [];
  let now = new Date().getTime() / 1000;
  const monthInSeconds = 30 * 86_400;

  for (let i = 1; i <= 3; i++) {
    data.push(now + monthInSeconds);
    now += monthInSeconds;
  }

  return data;
}

const YieldChart: FC<Props> = () => {
  const { depositsRates } = useYieldRates();

  const assets = useAssets();

  function getRandomColor() {
    return '#' + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, '0');
  }

  return (
    <Box display="flex" flexDirection="column" width="100%" height="100%" gap={2}>
      <Box display="flex" justifyContent="space-between">
        <Typography variant="h6">Yield Curve</Typography>
      </Box>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={depositsRates}>
          <CartesianGrid strokeDasharray="3 1" horizontal={false} />
          <XAxis
            dataKey="maturity"
            type="number"
            stroke="#8f8c9c"
            tickMargin={16}
            tickFormatter={(t) => formatXAxis(t)}
            tick={tick}
            ticks={ticks}
            domain={[0, 3 * 30 * 86_400].map((ts) => Date.now() / 1000 + ts)}
            scale="time"
          />
          <YAxis unit="%" type="number" yAxisId="1" tickLine={false} tick={tick} />
          <Tooltip />
          {assets.map((asset) => (
            <Line key={asset} yAxisId="1" dataKey={asset} stroke={getRandomColor()} animationDuration={300} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default React.memo(YieldChart);
