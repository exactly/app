import React, { useCallback, useMemo, useState } from 'react';
import { Typography, useTheme, Box } from '@mui/material';
import { LineChart, XAxis, Tooltip, Line, ResponsiveContainer, CartesianGrid, YAxis } from 'recharts';

import { toPercentage } from 'utils/utils';
import useUtilizationRate from 'hooks/useUtilizationRate';
import TooltipChart, { TooltipChartProps } from '../TooltipChart';
import LoadingChart from '../LoadingChart';
import numbers from 'config/numbers.json';
import parseTimestamp from 'utils/parseTimestamp';
import ButtonsChart from '../ButtonsChart';
import { useTranslation } from 'react-i18next';

type Props = {
  type: 'floating' | 'fixed';
  symbol: string;
};

const formatEmpty = () => '';

function UtilizationRateChart({ type, symbol }: Props) {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const [zoom, setZoom] = useState<boolean>(true);
  const { currentUtilization } = useUtilizationRate(type, symbol);
  const [hoverUtilizations, setHoverUtilizations] = useState<number[]>([]);

  const [currentMin, currentMax, interval] = useMemo(() => {
    if (!zoom || !currentUtilization) return [undefined, undefined, numbers.chartInterval];
    if (!currentUtilization.length) return [numbers.chartInterval, undefined, undefined];
    if (currentUtilization.length === 1)
      return [
        Math.max(0, currentUtilization[0].utilization - 10 * numbers.chartInterval),
        currentUtilization[0].utilization + 9 * numbers.chartInterval,
        numbers.chartInterval,
      ];

    const min = Math.min(...currentUtilization.map((item) => item.utilization));
    const max = Math.max(...currentUtilization.map((item) => item.utilization));
    const gap = Math.abs(max - min) / numbers.dataPointsInChart || numbers.chartInterval;

    return [
      Math.max(0, min - gap * Math.floor(numbers.dataPointsInChart * 0.05)),
      max + gap * Math.floor(numbers.dataPointsInChart * 0.05),
      gap,
    ];
  }, [currentUtilization, zoom]);

  const { data, loading } = useUtilizationRate(
    type,
    symbol,
    currentMin,
    currentMax,
    interval,
    currentUtilization ? currentUtilization?.map((item) => item.utilization) : [],
  );

  const [cursorStyle, setCursorStyle] = useState('default');

  const handleMouseEnter = (utilization: number) => {
    setHoverUtilizations((currentHoverPools) => [...currentHoverPools.filter((u) => u !== utilization), utilization]);
    setCursorStyle('pointer');
  };

  const handleMouseLeave = (utilization: number) => {
    setHoverUtilizations((currentHoverPools) => currentHoverPools.filter((u) => u !== utilization));
    setCursorStyle('default');
  };

  const maturitiesOnTooltip = useMemo(
    () =>
      currentUtilization
        ? currentUtilization
            .filter(({ utilization }) => hoverUtilizations.includes(utilization))
            .map(({ maturity }) => maturity)
        : [],
    [currentUtilization, hoverUtilizations],
  );

  const buttons = useMemo(
    () => [
      {
        label: t('ZOOM IN'),
        onClick: () => setZoom(true),
      },
      {
        label: t('ZOOM OUT'),
        onClick: () => setZoom(false),
      },
    ],
    [t],
  );

  return (
    <Box display="flex" flexDirection="column" width="100%" height="100%" gap={2}>
      <Box display="flex" justifyContent="space-between">
        <Typography variant="h6" fontSize="16px">
          {type === 'floating' ? t('Utilization Rate (Variable Rate Pool)') : t('Utilization Rates (Fixed Rate Pools)')}
        </Typography>
        <Box>
          <ButtonsChart buttons={buttons} />
        </Box>
      </Box>
      <ResponsiveContainer width="100%" height="100%">
        {loading || !currentUtilization ? (
          <LoadingChart />
        ) : (
          <LineChart data={data} margin={{ top: 5, bottom: 5 }} style={{ cursor: cursorStyle }}>
            <CartesianGrid stroke={palette.grey[300]} vertical={false} />
            <XAxis
              type="number"
              dataKey="utilization"
              tickFormatter={(tick) => toPercentage(tick, zoom ? 2 : 0)}
              stroke={palette.grey[400]}
              tick={{ fill: palette.grey[500], fontWeight: 500, fontSize: 11 }}
              allowDataOverflow
              domain={['DataMin', 'DataMax']}
              offset={10}
              label={{
                value: t('Utilization Rate'),
                position: 'insideBottom',
                offset: 0,
                fill: palette.grey[500],
                fontWeight: 500,
                fontSize: 11,
              }}
              padding={{ left: 20, right: 20 }}
            />
            <YAxis
              allowDataOverflow
              orientation="left"
              type="number"
              tickFormatter={(tick) => toPercentage(tick, zoom ? 2 : 0)}
              yAxisId="yaxis"
              axisLine={false}
              tick={{ fill: palette.grey[500], fontWeight: 500, fontSize: 11 }}
              tickLine={false}
              domain={[
                (dataMin: number) => dataMin,
                (dataMax: number) => (type === 'floating' && !zoom ? 1.5 : Math.min(1.5, dataMax)),
              ]}
              label={{
                value: t('APR'),
                position: 'insideRight',
                fill: palette.grey[500],
                fontWeight: 500,
                offset: 50,
                angle: -90,
                fontSize: 11,
              }}
              padding={{ bottom: 5 }}
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
                <CustomTooltipChart
                  highlighted={currentUtilization}
                  maturitiesOnTooltip={maturitiesOnTooltip}
                  type={type}
                  zoom={zoom}
                />
              }
              cursor={{ strokeWidth: 1, fill: palette.grey[500], strokeDasharray: '3' }}
            />

            <Line
              name={t('Utilization') ?? undefined}
              type="monotone"
              yAxisId="yaxis2"
              dataKey="utilization"
              dot={false}
              stroke={palette.mode === 'light' ? 'black' : 'white'}
              strokeWidth={0}
              activeDot={false}
              animationDuration={2000}
            />

            <Line
              dot={(props) => (
                <CustomDot
                  {...props}
                  color={palette.operation.variable}
                  dotsToHighlight={currentUtilization.map((item) => item.utilization)}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                />
              )}
              name={t('Borrow APR') ?? undefined}
              yAxisId="yaxis"
              type="monotone"
              dataKey="apr"
              stroke={palette.mode === 'light' ? 'black' : 'white'}
              strokeWidth={2}
              isAnimationActive={false}
              activeDot={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </Box>
  );
}

const CustomDot = ({
  cx,
  cy,
  payload: { utilization },
  color,
  dotsToHighlight,
  onMouseEnter,
  onMouseLeave,
}: {
  cx: number;
  cy: number;
  payload: { utilization: number; apr: number };
  color: string;
  dotsToHighlight?: number[];
  onMouseEnter: (utilization: number) => void;
  onMouseLeave: (utilization: number) => void;
}) => {
  const { palette } = useTheme();
  const [fillColor, setFillColor] = useState<string | undefined>();

  const onHover = useCallback(() => {
    setFillColor(color);
    onMouseEnter(utilization);
  }, [color, onMouseEnter, utilization]);

  const onLeave = useCallback(() => {
    setFillColor(undefined);
    onMouseLeave(utilization);
  }, [onMouseLeave, utilization]);

  if (!dotsToHighlight || !dotsToHighlight.includes(utilization)) return null;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      stroke={color}
      strokeWidth={2}
      fill={fillColor || palette.background.paper}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    />
  );
};

const CustomTooltipChart = ({
  highlighted,
  maturitiesOnTooltip,
  type,
  payload,
  zoom,
  ...props
}: TooltipChartProps & {
  highlighted: Record<string, number>[];
  maturitiesOnTooltip: number[];
  type: 'fixed' | 'floating';
  zoom: boolean;
}) => {
  const { t } = useTranslation();
  const { palette } = useTheme();

  const utilizationPayload = useMemo(() => payload?.find(({ dataKey }) => dataKey === 'utilization'), [payload]);

  const round = useCallback((value: number) => parseFloat(value.toFixed(zoom ? 5 : 2)), [zoom]);

  const matches = useMemo(
    () => highlighted.filter(({ utilization }) => round(utilization) === round(utilizationPayload?.value || 0)),
    [highlighted, round, utilizationPayload?.value],
  );

  const maturitiesToShow = useMemo(
    () => [...new Set([...maturitiesOnTooltip, ...matches.map(({ maturity }) => maturity)])].sort(),
    [matches, maturitiesOnTooltip],
  );

  if (!matches) return <TooltipChart payload={payload} {...props} />;

  return (
    <TooltipChart
      payload={payload}
      {...props}
      additionalInfoPosition="top"
      additionalInfo={maturitiesToShow.map((maturity) => (
        <Typography key={`maturity_${maturity}}`} variant="h6" fontSize="12px" color={palette.operation.variable}>
          {type === 'floating'
            ? t('Current Utilization')
            : `${t('Maturity Date')}: ${parseTimestamp(maturity, 'MMM DD')}`}
        </Typography>
      ))}
    />
  );
};

export default React.memo(UtilizationRateChart);
