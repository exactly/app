import React, { CSSProperties, useMemo } from 'react';
import { Typography, useTheme, Box } from '@mui/material';
import { LineChart, XAxis, Tooltip, Line, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import { BigNumber } from '@ethersproject/bignumber';

import { Previewer } from 'types/contracts';
import { toPercentage } from 'utils/utils';
import interestRateCurve from 'utils/interestRateCurve';
import TooltipChart from './TooltipChart';
import LoadingChart from './LoadingChart';

const MAX = 1;
const INTERVAL = 0.005;

type Props = {
  type: 'floating' | 'fixed';
  current?: BigNumber;
  interestRateModel?: Previewer.InterestRateModelStructOutput;
};

function UtilizationRateChart({ type, current: currentUtilization, interestRateModel }: Props) {
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

  const parsedCurrentUtilization = useMemo(() => {
    if (!currentUtilization) {
      return undefined;
    }

    return Number(currentUtilization) / 1e18;
  }, [currentUtilization]);

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
        {!parsedCurrentUtilization || !data.length ? (
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
              x={parsedCurrentUtilization}
              strokeWidth={2}
              stroke={palette.operation.variable}
              label={{
                value: toPercentage(parsedCurrentUtilization),
                position: parsedCurrentUtilization && parsedCurrentUtilization < 0.5 ? 'insideLeft' : 'insideRight',
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
