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
import type { Operation } from 'types/Operation';

type Props = {
  type: 'floating' | 'fixed';
  operation: Operation;
  symbol: string;
  from?: number;
  to?: number;
  fixedRate?: bigint;
  floatingRate?: number;
};

const formatEmpty = () => '';

function UtilizationRateWithAreaChart({ type = 'fixed', operation, symbol, from, to, fixedRate, floatingRate }: Props) {
  const { palette, typography } = useTheme();

  const [interval, isSmallRange, utilizationMidPoint] = useMemo(() => {
    if (from === undefined || to === undefined) return [numbers.chartInterval, true, 0];
    const range = Math.abs(from - to);
    return [
      Math.abs(from - to) / numbers.dataPointsInChart || numbers.chartInterval,
      range < numbers.minUtilizationRange,
      (from + to) / 2,
    ];
  }, [from, to]);

  const { data, loading } = useUtilizationRate(
    type,
    symbol,
    Math.max(0, Math.min(from || 0, to || 0) - interval * Math.floor(numbers.dataPointsInChart * 0.4)),
    Math.max(from || 0, to || 0) + interval * Math.floor(numbers.dataPointsInChart * 0.4),
    interval,
    [
      ...(from !== undefined ? [from] : []),
      ...(to !== undefined ? [to] : []),
      ...(isSmallRange ? [utilizationMidPoint] : []),
    ],
    [...(fixedRate !== undefined && !isSmallRange ? [fixedRate] : [])],
  );

  const allUtilizations = useMemo(
    () => [...(from !== undefined ? [{ utilization: from }] : []), ...(to !== undefined ? [{ utilization: to }] : [])],
    [from, to],
  );

  const dataWithArea = useMemo(() => {
    if (!data || from === undefined || to === undefined) return [[], 0];

    const minUtilization = Math.min(from, to);
    const maxUtilization = Math.max(from, to);

    return [
      ...data.filter((item) => item.utilization <= minUtilization).map((item) => ({ ...item, areaAPR: 0 })),
      ...data
        .filter((item) => item.utilization >= minUtilization && item.utilization <= maxUtilization)
        .map((item) => ({ ...item, areaAPR: item.apr })),
      ...data.filter((item) => item.utilization >= maxUtilization).map((item) => ({ ...item, areaAPR: 0 })),
    ];
  }, [data, from, to]);
  const getReferenceLineValue = useCallback((utilization: number): string => `${toPercentage(utilization)}`, []);

  const label: CSSProperties = {
    fontWeight: 500,
    fontFamily: typography.fontFamilyMonospaced,
    fill: palette.grey[900],
  };

  const currentAPR = useMemo(() => (fixedRate ? Number(fixedRate) / 1e18 : floatingRate), [fixedRate, floatingRate]);

  return (
    <Box display="flex" flexDirection="column" width="100%" height="100%" gap={2}>
      <ResponsiveContainer width="100%" height="100%">
        {loading || !dataWithArea || !dataWithArea.length || from === undefined || to === undefined ? (
          <LoadingChart />
        ) : (
          <ComposedChart data={dataWithArea} margin={{ top: 12, bottom: 5 }}>
            <defs>
              <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={palette.operation[type === 'fixed' ? 'fixed' : 'variable']}
                  stopOpacity={0.5}
                />
                <stop
                  offset="95%"
                  stopColor={palette.operation[type === 'fixed' ? 'fixed' : 'variable']}
                  stopOpacity={0}
                />
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
              padding={{ left: 40, right: 40 }}
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
                  opacity={0.8}
                  ignoreKeys={['areaAPR', ...(!operation.includes('borrow') ? ['apr'] : [])]}
                  additionalInfo={
                    currentAPR !== undefined &&
                    operation.includes('borrow') && (
                      <Typography
                        variant="h6"
                        fontSize="12px"
                        color={palette.operation[type === 'fixed' ? 'variable' : 'fixed']}
                      >
                        {`${fixedRate ? 'Your APR:' : 'Current Variable APR:'} ${toPercentage(currentAPR)}`}
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
            {operation.includes('borrow') && (
              <ReferenceLine
                y={currentAPR}
                strokeWidth={2}
                yAxisId="yaxis"
                stroke={palette.operation[type === 'fixed' ? 'variable' : 'fixed']}
                label={{
                  value: `${fixedRate ? 'Your APR:' : 'Current Variable APR:'} ${toPercentage(currentAPR)}`,
                  position: 'insideBottomRight',
                  style: { ...label, fontSize: 10, fill: palette.operation[type === 'fixed' ? 'variable' : 'fixed'] },
                }}
                strokeDasharray="5 5"
                isFront
              />
            )}
            {allUtilizations &&
              allUtilizations.map(({ utilization }, index) => (
                <ReferenceLine
                  x={utilization}
                  key={`${utilization}_${index}`}
                  strokeWidth={1.5}
                  yAxisId="yaxis"
                  stroke={palette.operation[type === 'fixed' ? 'fixed' : 'variable']}
                  label={{
                    value: getReferenceLineValue(utilization),
                    position: utilization === Math.min(from, to) ? 'insideBottomRight' : 'insideBottomLeft',
                    style: { ...label, fontSize: 12, fill: palette.operation[type === 'fixed' ? 'fixed' : 'variable'] },
                  }}
                  strokeDasharray={utilization === to ? '5 5' : ''}
                  isFront
                />
              ))}
            <Area
              type="monotone"
              dataKey="areaAPR"
              stroke={palette.operation[type === 'fixed' ? 'fixed' : 'variable']}
              fillOpacity={0.8}
              fill="url(#colorArea)"
              yAxisId="yaxis"
            />
            <Line
              dot={(props) => (
                <CustomDot
                  {...props}
                  color={palette.operation[type === 'fixed' ? 'variable' : 'fixed']}
                  aprToHighlight={currentAPR !== undefined && !isSmallRange ? currentAPR : undefined}
                  utilizationToHighlight={currentAPR !== undefined && isSmallRange ? utilizationMidPoint : undefined}
                />
              )}
              name="Borrow APR"
              yAxisId="yaxis"
              type="monotone"
              dataKey="apr"
              stroke={palette.mode === 'light' ? 'black' : 'white'}
              opacity={0.3}
              strokeWidth={1}
              animationDuration={2000}
            />
          </ComposedChart>
        )}
      </ResponsiveContainer>
    </Box>
  );
}

const CustomDot = ({
  cx,
  cy,
  payload,
  color,
  aprToHighlight,
  utilizationToHighlight,
}: {
  cx: number;
  cy: number;
  payload: { utilization: number; apr: number };
  color: string;
  aprToHighlight?: number;
  utilizationToHighlight?: number;
}) => {
  if (
    (!isNaN(cy) && !isNaN(cx) && aprToHighlight && payload?.apr === aprToHighlight) ||
    (utilizationToHighlight && payload?.utilization === utilizationToHighlight)
  ) {
    return <circle cx={cx} cy={cy} r={2} stroke={color} strokeWidth={1.5} fill={color} />;
  }
  return null;
};

export default React.memo(UtilizationRateWithAreaChart);
