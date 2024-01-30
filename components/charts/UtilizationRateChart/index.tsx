import React, { useCallback, useMemo, useState } from 'react';
import { Typography, useTheme, Box } from '@mui/material';
import { LineChart, XAxis, Tooltip, Line, ResponsiveContainer, CartesianGrid, YAxis } from 'recharts';
import { useTranslation } from 'react-i18next';

import { toPercentage } from 'utils/utils';
import useUtilizationRate, { useCurrentUtilizationRate, INTERVAL } from 'hooks/useUtilizationRate';
import TooltipChart, { TooltipChartProps } from '../TooltipChart';
import LoadingChart from '../LoadingChart';
import ButtonsChart from '../ButtonsChart';
import { bmin, bmax, abs } from 'utils/fixedMath';

type Props = {
  type: 'floating' | 'fixed';
  symbol: string;
};

const formatEmpty = () => '';

function UtilizationRateChart({ type, symbol }: Props) {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const [zoom, setZoom] = useState<boolean>(true);
  const currentUtilization = useCurrentUtilizationRate(type, symbol);

  const [currentMin, currentMax, interval] = useMemo(() => {
    if (!zoom || !currentUtilization || !currentUtilization.length) return [undefined, undefined, INTERVAL];
    if (currentUtilization.length === 1) {
      return [
        bmax(0n, currentUtilization[0].utilization - 10n * INTERVAL),
        currentUtilization[0].utilization + 9n * INTERVAL,
        INTERVAL,
      ];
    }

    const min = bmin(...currentUtilization.map((item) => item.utilization));
    const max = bmax(...currentUtilization.map((item) => item.utilization));
    const gap = abs(max - min) / 100n || INTERVAL;

    return [bmax(0n, min - gap * 5n), max + gap * 5n, gap];
  }, [currentUtilization, zoom]);

  const { data, globalUtilization, loading } = useUtilizationRate(symbol, currentMin, currentMax, interval);

  const [cursorStyle, setCursorStyle] = useState('default');

  const handleMouseEnter = () => {
    setCursorStyle('pointer');
  };

  const handleMouseLeave = () => {
    setCursorStyle('default');
  };

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
        {loading ? (
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
                  highlighted={currentUtilization || []}
                  zoom={zoom}
                  globalUtilization={globalUtilization}
                />
              }
              cursor={{ strokeWidth: 1, fill: palette.grey[500], strokeDasharray: '3' }}
            />

            <Line
              name={t('Utilization')}
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
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                />
              )}
              name={t('APR (Current)')}
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
  payload: { highlight },
  color,
  onMouseEnter,
  onMouseLeave,
}: {
  cx: number;
  cy: number;
  payload: { highlight: boolean };
  color: string;
  dotsToHighlight?: number[];
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) => {
  const { palette } = useTheme();
  const [fillColor, setFillColor] = useState<string | undefined>();

  const onHover = useCallback(() => {
    setFillColor(color);
    onMouseEnter();
  }, [color, onMouseEnter]);

  const onLeave = useCallback(() => {
    setFillColor(undefined);
    onMouseLeave();
  }, [onMouseLeave]);

  if (!highlight) return null;

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
  payload,
  zoom,
  globalUtilization,
  ...props
}: Omit<TooltipChartProps, 'payload'> & {
  payload?: (NonNullable<TooltipChartProps['payload']>[number] & { payload: Record<string, number | boolean> })[];
  highlighted: { utilization: bigint }[];
  zoom: boolean;
  globalUtilization: bigint;
}) => {
  const { t } = useTranslation();
  const { palette } = useTheme();

  const utilizationPayload = useMemo(() => payload?.find(({ dataKey }) => dataKey === 'utilization'), [payload]);

  const round = useCallback((value: number) => parseFloat(value.toFixed(zoom ? 5 : 2)), [zoom]);

  const matches = useMemo(
    () =>
      highlighted.filter(
        ({ utilization }) => round(Number(utilization) / 1e18) === round(utilizationPayload?.value || 0),
      ).length > 0,
    [highlighted, round, utilizationPayload?.value],
  );

  return (
    <TooltipChart
      payload={payload}
      {...props}
      additionalInfoPosition="top"
      additionalInfo={
        <>
          {matches && (
            <Typography variant="h6" fontSize="12px" color={palette.operation.variable}>
              {t('Current')}
            </Typography>
          )}
          <Typography variant="h6" fontSize="12px">
            {t('Global Utilization')}: {toPercentage(Number(globalUtilization) / 1e18)}
          </Typography>
        </>
      }
    />
  );
};

export default React.memo(UtilizationRateChart);
