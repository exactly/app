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
import { useTranslation } from 'react-i18next';

type Props = {
  type: 'floating' | 'fixed';
  symbol: string;
};

const formatEmpty = () => '';

function UtilizationRateChart({ type, symbol }: Props) {
  const { t } = useTranslation();
  const { palette, typography } = useTheme();
  const { currentUtilization, data, loading } = useUtilizationRate(type, symbol);
  const [zoom, setZoom] = useState<boolean>(true);

  const slicedData = useMemo(() => {
    if (!currentUtilization || currentUtilization.length === 0 || !zoom) return data;

    const minUtilization = Math.min(...currentUtilization.map((item) => item.utilization));
    const maxUtilization = Math.max(...currentUtilization.map((item) => item.utilization));

    const left = minUtilization * (1 - numbers.chartGap);
    const right = maxUtilization * (1 + numbers.chartGap);

    return data.filter((item) => item.utilization >= left && item.utilization <= right);
  }, [currentUtilization, data, zoom]);

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

  const label: CSSProperties = {
    fontWeight: 500,
    fontFamily: typography.fontFamilyMonospaced,
    fill: palette.grey[900],
  };

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
          <LineChart data={slicedData} margin={{ top: 5, bottom: 5 }}>
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
              content={<TooltipChart />}
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
              name={t('Borrow APR') ?? undefined}
              yAxisId="yaxis"
              type="monotone"
              dataKey="apr"
              stroke={palette.mode === 'light' ? 'black' : 'white'}
              dot={false}
              strokeWidth={2}
              animationDuration={2000}
            />
            {currentUtilization &&
              currentUtilization.map(({ maturity, utilization }) => (
                <ReferenceLine
                  x={utilization}
                  key={`${utilization}_${maturity}}`}
                  strokeWidth={2}
                  yAxisId="yaxis"
                  stroke={palette.operation.variable}
                  label={{
                    value: `${toPercentage(utilization)} ${type === 'fixed' ? parseTimestamp(maturity, 'MMM,DD') : ''}`,
                    position: utilization < 0.5 ? 'insideBottomLeft' : 'insideTopRight',
                    offset: 15,
                    angle: -90,
                    style: { ...label, fontSize: 13, fill: palette.operation.variable },
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
