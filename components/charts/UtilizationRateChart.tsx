import React, { useMemo, useState } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import {
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
  ReferenceDot,
  Label,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import { BigNumber, formatFixed } from '@ethersproject/bignumber';

import { Previewer } from 'types/contracts';
import { toPercentage } from 'utils/utils';
import interestRateCurve from 'utils/interestRateCurve';

const MAX = 1;
const INTERVAL = 0.005;

const tickFormatter = (tick: number) => `${tick * 100}%`;

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

const xTicks = [0, 0.25, 0.5, 0.75, 1];
const yTicks = [0.1, 0.2, 0.3, 0.4, 0.5];

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

    const curve = interestRateCurve(
      parseFloat(formatFixed(A, 18)),
      parseFloat(formatFixed(B, 18)),
      parseFloat(formatFixed(UMax, 18)),
    );

    return Array.from({ length: MAX / INTERVAL })
      .map((_, i) => {
        const utilization = i * INTERVAL;
        return { utilization, apr: curve(utilization) };
      })
      .filter(({ apr }) => apr < 0.65);
  }, [type, interestRateModel]);

  const [parsedCurrentUtilization, parsedCurrentRate] = useMemo(() => {
    if (!currentUtilization || !currentRate) {
      return [undefined, undefined];
    }

    return [parseFloat(formatFixed(currentUtilization, 18)), parseFloat(formatFixed(currentRate, 18))];
  }, [currentUtilization, currentRate]);

  return (
    <>
      <Typography variant="h6" mb={2.5}>
        Utilization Rate
      </Typography>
      <ResponsiveContainer width="100%" minHeight={320} height={320}>
        <LineChart data={data} width={500} height={500} margin={{ left: 30, bottom: 20 }}>
          <XAxis
            type="number"
            dataKey="utilization"
            tickFormatter={tickFormatter}
            ticks={xTicks}
            tickLine={false}
            stroke={palette.grey[800]}
            label={{
              value: 'Utilization',
              position: 'bottom',
              style: {
                fontFamily: typography.fontFamilyMonospaced,
                fontWeight: 500,
                fill: palette.grey[900],
              },
            }}
          />
          <YAxis
            type="number"
            dataKey="apr"
            ticks={yTicks}
            tickFormatter={tickFormatter}
            mirror
            tickLine={false}
            domain={[0, 0]}
            stroke={palette.grey[800]}
            label={{
              value: 'Borrow APR',
              angle: -90,
              position: 'left',
              offset: 20,
              style: {
                fontFamily: typography.fontFamilyMonospaced,
                fontWeight: 500,
                fill: palette.grey[900],
              },
            }}
          />
          <CartesianGrid strokeDasharray="4" stroke={palette.grey[300]} />
          <Tooltip content={<ChartTooltip />} />

          <ReferenceLine x={1} stroke={palette.grey[600]} strokeWidth={2} />
          <ReferenceDot x={parsedCurrentUtilization} y={parsedCurrentRate} strokeWidth={2} r={5} fill="#000">
            <Label position="top" style={{ fontFamily: typography.fontFamilyMonospaced, fill: palette.grey[900] }}>
              {toPercentage(parsedCurrentRate)}
            </Label>
          </ReferenceDot>
          <Line
            type="monotone"
            dataKey="apr"
            stroke="#000"
            dot={false}
            strokeWidth={2}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}

export default React.memo(UtilizationRateChart);
