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
  mini?: boolean;
  previewUtilization?: number;
};

const formatEmpty = () => '';

function UtilizationRateChart({ type, symbol, mini, previewUtilization }: Props) {
  const { palette, typography } = useTheme();
  const { currentUtilization, data, loading } = useUtilizationRate(type, symbol);
  const [zoom, setZoom] = useState<boolean>(true);

  const allUtilizations = useMemo(
    () => [
      ...(currentUtilization ? currentUtilization : []),
      ...(previewUtilization ? [{ maturity: 1, utilization: previewUtilization }] : []),
    ],
    [currentUtilization, previewUtilization],
  );

  const slicedData = useMemo(() => {
    if (!allUtilizations || allUtilizations.length === 0 || !zoom) return data;

    const minUtilization = Math.min(...allUtilizations.map((item) => item.utilization));
    const maxUtilization = Math.max(...allUtilizations.map((item) => item.utilization));

    const left = minUtilization * (1 - numbers.chartGap * (mini ? 0.05 : 1));
    const right = maxUtilization * (1 + numbers.chartGap * (mini ? 0.05 : 1));

    return data.filter((item) => item.utilization >= left && item.utilization <= right);
  }, [allUtilizations, data, zoom, mini]);

  const buttons = useMemo(
    () => [
      {
        label: 'ZOOM IN',
        onClick: () => setZoom(true),
      },
      {
        label: 'ZOOM OUT',
        onClick: () => setZoom(false),
      },
    ],
    [],
  );

  const label: CSSProperties = {
    fontWeight: 500,
    fontFamily: typography.fontFamilyMonospaced,
    fill: palette.grey[900],
  };

  return (
    <Box display="flex" flexDirection="column" width="100%" height="100%" gap={2}>
      {!mini && (
        <Box display="flex" justifyContent="space-between">
          <Typography variant="h6" fontSize="16px">
            {type === 'floating' ? 'Utilization Rate (Variable Rate Pool)' : 'Utilization Rates (Fixed Rate Pools)'}
          </Typography>
          <Box>
            <ButtonsChart buttons={buttons} />
          </Box>
        </Box>
      )}
      <ResponsiveContainer width="100%" height="100%">
        {loading ? (
          <LoadingChart />
        ) : (
          <LineChart data={slicedData} margin={{ top: 5, bottom: 5 }}>
            <CartesianGrid stroke={palette.grey[300]} vertical={false} />
            <XAxis
              type="number"
              dataKey="utilization"
              tickFormatter={(t) => toPercentage(t, zoom ? 2 : 0)}
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
              tickFormatter={(t) => toPercentage(t, zoom ? 2 : 0)}
              yAxisId="yaxis"
              axisLine={false}
              tick={{ fill: palette.grey[500], fontWeight: 500, fontSize: 11 }}
              tickLine={false}
              domain={[
                (dataMin: number) => dataMin,
                (dataMax: number) => (type === 'floating' && !zoom ? 1.5 : Math.min(1.5, dataMax)),
              ]}
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
              content={<TooltipChart />}
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

            <Line
              name="Borrow APR"
              yAxisId="yaxis"
              type="monotone"
              dataKey="apr"
              stroke={palette.mode === 'light' ? 'black' : 'white'}
              dot={false}
              strokeWidth={2}
              animationDuration={2000}
            />
            {allUtilizations &&
              allUtilizations.map(({ maturity, utilization }) => (
                <ReferenceLine
                  x={utilization}
                  key={`${utilization}_${maturity}}`}
                  strokeWidth={2}
                  yAxisId="yaxis"
                  stroke={palette.operation[maturity ? 'fixed' : 'variable']}
                  label={{
                    value: `${toPercentage(utilization)} ${type === 'fixed' ? parseTimestamp(maturity, 'MMM,DD') : ''}`,
                    position: utilization < 0.5 ? 'insideBottomLeft' : 'insideTopRight',
                    offset: 15,
                    angle: -90,
                    style: { ...label, fontSize: 12, fill: palette.operation[maturity ? 'fixed' : 'variable'] },
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
