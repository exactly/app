import React, { CSSProperties, useCallback, useMemo } from 'react';
import { useTheme, Box, Typography } from '@mui/material';
import {
  XAxis,
  Tooltip,
  Line,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
  YAxis,
  ComposedChart,
  Area,
} from 'recharts';

import { toPercentage } from 'utils/utils';
import useUtilizationRate from 'hooks/useUtilizationRate';
import TooltipChart from '../TooltipChart';
import LoadingChart from '../LoadingChart';
import numbers from 'config/numbers.json';
import { Operation } from 'contexts/ModalStatusContext';

type Props = {
  type: 'floating' | 'fixed';
  operation: Extract<Operation, 'depositAtMaturity' | 'withdrawAtMaturity' | 'borrowAtMaturity' | 'repayAtMaturity'>;
  symbol: string;
  from?: number;
  to?: number;
  fixedRate?: string;
};

const formatEmpty = () => '';

function UtilizationRateWithAreaChart({ type = 'fixed', operation, symbol, from, to, fixedRate }: Props) {
  const { palette, typography } = useTheme();

  const { data, loading } = useUtilizationRate(type, symbol, [
    ...(from !== undefined
      ? [from, Math.max(0, from - numbers.chartInterval), Math.max(0, from + numbers.chartInterval)]
      : []),
    ...(to !== undefined ? [to, Math.max(0, to - numbers.chartInterval), Math.max(0, to + numbers.chartInterval)] : []),
  ]);

  const allUtilizations = useMemo(
    () => [...(from !== undefined ? [{ utilization: from }] : []), ...(to !== undefined ? [{ utilization: to }] : [])],
    [from, to],
  );

  const slicedData = useMemo(() => {
    if (!data || from === undefined || to === undefined) return [[], 0];

    const minUtilization = Math.min(from, to);
    const maxUtilization = Math.max(from, to);
    const realGap = numbers.chartGap * (maxUtilization - minUtilization);
    const gap = Math.max(numbers.chartInterval, realGap);

    const left = Math.max(0, minUtilization - gap);
    const right = maxUtilization + gap;

    return [
      ...data
        .filter((item) => item.utilization >= left && item.utilization <= minUtilization)
        .map((item) => ({ ...item, areaAPR: 0 })),
      ...data
        .filter((item) => item.utilization >= minUtilization && item.utilization <= maxUtilization)
        .map((item) => ({ ...item, areaAPR: item.apr })),
      ...data
        .filter((item) => item.utilization >= maxUtilization && item.utilization <= right)
        .map((item) => ({ ...item, areaAPR: 0 })),
    ];
  }, [data, from, to]);

  const getReferenceLineValue = useCallback(
    (utilization: number): string => {
      return from?.toFixed(4) !== to?.toFixed(4) || utilization === from ? `${toPercentage(utilization)}` : '';
    },
    [from, to],
  );

  const label: CSSProperties = {
    fontWeight: 500,
    fontFamily: typography.fontFamilyMonospaced,
    fill: palette.grey[900],
  };

  return (
    <Box display="flex" flexDirection="column" width="100%" height="100%" gap={2}>
      <ResponsiveContainer width="100%" height="100%">
        {loading || !slicedData || !slicedData.length || from === undefined || to === undefined ? (
          <LoadingChart />
        ) : (
          <ComposedChart data={slicedData} margin={{ top: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={palette.grey[300]} vertical={false} />
            <XAxis
              type="number"
              dataKey="utilization"
              tickFormatter={(t) => toPercentage(t, 2)}
              stroke={palette.grey[400]}
              tick={{ fill: palette.grey[500], fontWeight: 500, fontSize: 11 }}
              allowDataOverflow={true}
              domain={['DataMin', 'DataMax']}
              offset={10}
              label={{
                value: 'Utilization Rate',
                position: 'insideBottom',
                offset: 0,
                fill: palette.grey[500],
                fontWeight: 500,
                fontSize: 11,
              }}
            />
            <YAxis
              allowDataOverflow={true}
              orientation="left"
              type="number"
              tickFormatter={(t) => toPercentage(t, 2)}
              yAxisId="yaxis"
              axisLine={false}
              tick={{ fill: palette.grey[500], fontWeight: 500, fontSize: 11 }}
              tickLine={false}
              label={{
                value: 'APR',
                position: 'insideRight',
                fill: palette.grey[500],
                fontWeight: 500,
                offset: 50,
                angle: -90,
                fontSize: 11,
              }}
            />
            <YAxis
              allowDataOverflow={true}
              orientation="right"
              type="number"
              tick={false}
              yAxisId="yaxis2"
              axisLine={false}
              tickLine={false}
              width={0}
            />

            <Tooltip
              labelFormatter={formatEmpty}
              formatter={(value) => toPercentage(value as number)}
              content={
                <TooltipChart
                  ignoreKeys={['areaAPR', ...(operation !== 'borrowAtMaturity' ? ['apr'] : [])]}
                  additionalInfo={
                    fixedRate &&
                    operation === 'borrowAtMaturity' && (
                      <Typography variant="h6" fontSize="12px" color="#82ca9d">
                        Your APR: {fixedRate}
                      </Typography>
                    )
                  }
                />
              }
              cursor={{ strokeWidth: 1, fill: palette.grey[500], strokeDasharray: '3' }}
            />

            <Line
              name="Utilization"
              type="monotone"
              yAxisId="yaxis2"
              dataKey="utilization"
              dot={false}
              stroke={palette.mode === 'light' ? 'black' : 'white'}
              strokeWidth={0}
              activeDot={false}
              animationDuration={2000}
            />
            {allUtilizations &&
              allUtilizations.map(({ utilization }) => (
                <ReferenceLine
                  x={utilization}
                  key={`${utilization}`}
                  strokeWidth={2}
                  yAxisId="yaxis"
                  stroke={palette.operation.variable}
                  label={{
                    value: getReferenceLineValue(utilization),
                    position: utilization === Math.min(from, to) ? 'insideRight' : 'insideBottomLeft',
                    offset: utilization === Math.min(from, to) ? 11 : 15,
                    angle: -90,
                    style: { ...label, fontSize: 12, fill: palette.operation.variable },
                  }}
                  strokeDasharray={utilization === to ? '5 5' : ''}
                  isFront
                />
              ))}
            <Area
              type="monotone"
              dataKey="areaAPR"
              stroke="#82ca9d"
              fillOpacity={1}
              fill="url(#colorArea)"
              yAxisId="yaxis"
            />
            <Line
              name="Borrow APR"
              yAxisId="yaxis"
              type="monotone"
              dataKey="apr"
              stroke={palette.mode === 'light' ? 'black' : 'white'}
              opacity={0.5}
              dot={false}
              strokeWidth={2}
              animationDuration={2000}
            />
          </ComposedChart>
        )}
      </ResponsiveContainer>
    </Box>
  );
}

export default React.memo(UtilizationRateWithAreaChart);
