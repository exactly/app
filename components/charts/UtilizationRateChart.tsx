import React, { CSSProperties } from 'react';
import { Typography, useTheme, Box } from '@mui/material';
import { LineChart, XAxis, Tooltip, Line, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';

import { toPercentage } from 'utils/utils';
import useUtilizationRate from 'hooks/useUtilizationRate';
import TooltipChart from './TooltipChart';
import LoadingChart from './LoadingChart';

type Props = {
  type: 'floating' | 'fixed';
  symbol: string;
};

function UtilizationRateChart({ type, symbol }: Props) {
  const { palette, typography } = useTheme();
  const { currentUtilization, data, loading } = useUtilizationRate(type, symbol);

  const label: CSSProperties = {
    fontWeight: 500,
    fontFamily: typography.fontFamilyMonospaced,
    fill: palette.grey[900],
  };

  return (
    <Box display="flex" flexDirection="column" width="100%" height="100%" gap={2}>
      <Typography variant="h6" fontSize="16px">
        Utilization Rate
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        {loading ? (
          <LoadingChart />
        ) : (
          <LineChart data={data} margin={{ top: 5, bottom: 5 }}>
            <CartesianGrid stroke={palette.grey[300]} vertical={false} />
            <XAxis
              type="number"
              dataKey="utilization"
              tickFormatter={toPercentage}
              stroke={palette.grey[400]}
              tick={{ fill: palette.grey[500], fontWeight: 500, fontSize: 12 }}
            />
            <ReferenceLine
              x={currentUtilization}
              strokeWidth={2}
              stroke={palette.operation.variable}
              label={{
                value: toPercentage(currentUtilization),
                position: currentUtilization && currentUtilization < 0.5 ? 'insideLeft' : 'insideRight',
                offset: 15,
                angle: -90,
                style: { ...label, fontSize: 14, fill: palette.operation.variable },
              }}
            />

            <Tooltip
              labelFormatter={() => ''}
              formatter={(value) => toPercentage(value as number)}
              content={<TooltipChart />}
              cursor={{ strokeWidth: 1, fill: palette.grey[500], strokeDasharray: '3' }}
            />

            <Line
              name="Utilization"
              type="monotone"
              dataKey="utilization"
              dot={false}
              stroke="#000"
              strokeWidth={0}
              activeDot={false}
            />

            <Line name="Borrow APR" type="monotone" dataKey="apr" stroke="#000" dot={false} strokeWidth={2} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </Box>
  );
}

export default React.memo(UtilizationRateChart);
