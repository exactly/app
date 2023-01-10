import React, { CSSProperties, useMemo } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { LineChart, XAxis, Tooltip, Line, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import type { TooltipProps } from 'recharts';
import { BigNumber } from '@ethersproject/bignumber';

import { Previewer } from 'types/contracts';
import { toPercentage } from 'utils/utils';
import interestRateCurve from 'utils/interestRateCurve';

const MAX = 1;
const INTERVAL = 0.005;

type TooltipRowProps = {
  label: string;
  value: string;
};

function TooltipRow({ label, value }: TooltipRowProps) {
  return (
    <Box display="flex" justifyContent="space-between" gap={1}>
      <Typography fontWeight={500} fontFamily="fontFamilyMonospaced">
        {label}
      </Typography>
      <Typography fontFamily="fontFamilyMonospaced">{value}</Typography>
    </Box>
  );
}

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.[0]) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <Box boxShadow="0px 4px 12px rgba(175, 177, 182, 0.2)" p={1} bgcolor="white" borderRadius={1} minWidth={200}>
      <TooltipRow label="Utilization" value={toPercentage(data.utilization)} />
      <TooltipRow label="Borrow APR" value={toPercentage(data.apr)} />
    </Box>
  );
}

type Props = {
  type: 'floating' | 'fixed';
  current: [BigNumber | undefined, BigNumber | undefined];
  interestRateModel?: Previewer.InterestRateModelStructOutput;
};

function UtilizationRateChart({ type, current: [currentUtilization, currentRate], interestRateModel }: Props) {
  const { palette, typography } = useTheme();

  const data = useMemo(() => {
    if (!interestRateModel) {
      return [];
    }

    const { A, B, UMax } =
      type === 'floating'
        ? {
            A: interestRateModel.floatingCurveA,
            B: interestRateModel.floatingCurveB,
            UMax: interestRateModel.floatingMaxUtilization,
          }
        : {
            A: interestRateModel.fixedCurveA,
            B: interestRateModel.fixedCurveB,
            UMax: interestRateModel.fixedMaxUtilization,
          };

    const curve = interestRateCurve(Number(A) / 1e18, Number(B) / 1e18, Number(UMax) / 1e18);

    return Array.from({ length: MAX / INTERVAL }).map((_, i) => {
      const utilization = i * INTERVAL;
      return { utilization, apr: curve(utilization) };
    });
  }, [type, interestRateModel]);

  const [parsedCurrentUtilization, parsedCurrentRate] = useMemo(() => {
    if (!currentUtilization || !currentRate) {
      return [undefined, undefined];
    }

    return [Number(currentUtilization) / 1e18, Number(currentRate) / 1e18];
  }, [currentUtilization, currentRate]);

  const label: CSSProperties = {
    fontWeight: 500,
    fontFamily: typography.fontFamilyMonospaced,
    fill: palette.grey[900],
  };

  return (
    <Box boxShadow="0px 4px 12px rgba(175, 177, 182, 0.2)" p={3} bgcolor="white" borderRadius={1}>
      <Typography variant="h6" mb={2.5}>
        Utilization Rate
      </Typography>
      <ResponsiveContainer width="100%" minHeight={320} height={320}>
        <LineChart data={data} width={500} height={500}>
          <CartesianGrid stroke={palette.grey[300]} vertical={false} />
          <XAxis
            type="number"
            dataKey="utilization"
            tickFormatter={toPercentage}
            tickLine={false}
            stroke={palette.grey[400]}
            tick={{ fill: palette.grey[500], fontWeight: 500, fontSize: 12 }}
          />
          <Tooltip
            active={true}
            cursor={{ strokeWidth: 1, fill: palette.grey[500], strokeDasharray: '3' }}
            content={<ChartTooltip />}
          />

          <Line
            type="monotone"
            dataKey="apr"
            stroke="#000"
            dot={false}
            strokeWidth={2}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />

          <ReferenceLine
            x={parsedCurrentUtilization}
            strokeWidth={2}
            stroke={palette.operation.variable}
            label={{
              value: `APR ${toPercentage(parsedCurrentRate)}`,
              position: parsedCurrentUtilization && parsedCurrentUtilization < 0.5 ? 'insideLeft' : 'insideRight',
              offset: 15,
              angle: -90,
              style: { ...label, fill: palette.operation.variable },
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}

export default React.memo(UtilizationRateChart);
