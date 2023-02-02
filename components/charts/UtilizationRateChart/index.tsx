import React, { CSSProperties, useMemo, useState } from 'react';
import { Typography, useTheme, Box } from '@mui/material';
import { LineChart, XAxis, Tooltip, Line, ResponsiveContainer, ReferenceLine, CartesianGrid, YAxis } from 'recharts';

import { toPercentage } from 'utils/utils';
import useUtilizationRate from 'hooks/useUtilizationRate';
import TooltipChart from '../TooltipChart';
import LoadingChart from '../LoadingChart';
import numbers from 'config/numbers.json';
import parseTimestamp from 'utils/parseTimestamp';
import ButtonsChart from '../ButtonsChart';

type Props = {
  type: 'floating' | 'fixed';
  symbol: string;
};

const formatEmpty = () => '';

function UtilizationRateChart({ type, symbol }: Props) {
  const { palette, typography } = useTheme();
  const { currentUtilization, data, loading } = useUtilizationRate(type, symbol);
  const [zoom, setZoom] = useState<'in' | 'out'>('in');

  const buttons = useMemo(
    () => [
      {
        label: 'IN',
        onClick: () => setZoom('in'),
      },
      {
        label: 'OUT',
        onClick: () => setZoom('out'),
      },
    ],
    [],
  );

  const xAxisDomain = useMemo(() => {
    if (currentUtilization && currentUtilization.length > 0 && zoom === 'in') {
      currentUtilization.sort((a, b) => a.utilization - b.utilization);

      const left = currentUtilization[0].utilization * 0.9;
      const right = currentUtilization[currentUtilization.length - 1].utilization * 1.1;

      return [left, right];
    }
    return ['DataMin', 'DataMax'];
  }, [currentUtilization, zoom]);

  const yAxisDomain = useMemo(() => {
    if (currentUtilization && currentUtilization.length > 0 && zoom === 'in') {
      currentUtilization.sort((a, b) => a.utilization - b.utilization);

      const bottomIndex =
        Math.floor(currentUtilization[0].utilization / numbers.chartInterval) - (type === 'floating' ? 40 : 1);
      const topIndex =
        Math.floor(currentUtilization[currentUtilization.length - 1].utilization / numbers.chartInterval) +
        (type === 'floating' ? 40 : 5);

      const slicedData = data.slice(bottomIndex, topIndex);

      return [slicedData[0].apr, slicedData[slicedData.length - 1].apr];
    }
    return ['DataMin', 'DataMax'];
  }, [currentUtilization, data, type, zoom]);

  const label: CSSProperties = {
    fontWeight: 500,
    fontFamily: typography.fontFamilyMonospaced,
    fill: palette.grey[900],
  };

  return (
    <Box display="flex" flexDirection="column" width="100%" height="100%" gap={2}>
      <Box display="flex" justifyContent="space-between">
        <Typography variant="h6" fontSize="16px">
          Utilization Rate
        </Typography>
        <Box>
          <ButtonsChart buttons={buttons} />
        </Box>
      </Box>
      <ResponsiveContainer width="100%" height="100%">
        {loading ? (
          <LoadingChart />
        ) : (
          <LineChart data={data} margin={{ top: 5, bottom: 5 }}>
            <CartesianGrid stroke={palette.grey[300]} vertical={false} />
            <XAxis
              type="number"
              dataKey="utilization"
              tickFormatter={(t) => toPercentage(t, zoom === 'in' ? 2 : 0)}
              stroke={palette.grey[400]}
              tick={{ fill: palette.grey[500], fontWeight: 500, fontSize: 12 }}
              allowDataOverflow={true}
              domain={xAxisDomain}
            />
            <YAxis
              allowDataOverflow={true}
              orientation="left"
              domain={yAxisDomain}
              type="number"
              tickFormatter={(t) => toPercentage(t, zoom === 'in' ? 2 : 0)}
              yAxisId="yaxis"
              axisLine={false}
              tick={{ fill: palette.grey[500], fontWeight: 500, fontSize: 12 }}
              tickLine={false}
              width={38}
            />

            <Tooltip
              labelFormatter={formatEmpty}
              formatter={(value) => toPercentage(value as number)}
              content={<TooltipChart />}
              cursor={{ strokeWidth: 1, fill: palette.grey[500], strokeDasharray: '3' }}
            />

            <Line
              name="Utilization"
              type="monotone"
              yAxisId="yaxis"
              dataKey="utilization"
              dot={false}
              stroke="#000"
              strokeWidth={0}
              activeDot={false}
              animationDuration={2000}
            />

            <Line
              name="Borrow APR"
              yAxisId="yaxis"
              type="monotone"
              dataKey="apr"
              stroke="#000"
              dot={false}
              strokeWidth={2}
              animationDuration={2000}
            />
            {currentUtilization &&
              currentUtilization.map(({ maturity, utilization }) => (
                <ReferenceLine
                  x={utilization}
                  key={utilization}
                  strokeWidth={2}
                  yAxisId="yaxis"
                  stroke={palette.operation.variable}
                  label={{
                    value: `${toPercentage(utilization)} ${
                      type === 'fixed' ? parseTimestamp(maturity, 'MMM,DD') : 'Variable pool'
                    }`,
                    position: utilization < 0.5 ? 'insideBottomLeft' : 'insideTopRight',
                    offset: 15,
                    angle: -90,
                    style: { ...label, fontSize: 14, fill: palette.operation.variable },
                  }}
                  isFront
                />
              ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </Box>
  );
}

export default React.memo(UtilizationRateChart);
