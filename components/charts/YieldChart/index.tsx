import { Box, Checkbox, FormControlLabel, Typography, useTheme } from '@mui/material';
import React, { FC, useCallback, useMemo, useState } from 'react';
import { ResponsiveContainer, XAxis, Tooltip, AreaChart, Area, CartesianGrid, YAxis } from 'recharts';
import useAssets from 'hooks/useAssets';
import useYieldRates from 'hooks/useYieldRates';
import parseTimestamp from 'utils/parseTimestamp';
import { toPercentage } from 'utils/utils';
import ButtonsChart from '../ButtonsChart';
import LoadingChart from '../LoadingChart';
import TooltipChart from '../TooltipChart';
import { useTranslation } from 'react-i18next';
import { track } from 'utils/segment';

type Props = {
  symbol: string;
};

const YieldChart: FC<Props> = ({ symbol }) => {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const { depositsRates, borrowsRates, loading } = useYieldRates(symbol);
  const assets = useAssets();
  const [operation, setOperation] = useState<'Deposits' | 'Borrows'>('Borrows');
  const [showComparison, setShowComparison] = useState<boolean>(false);

  const filteredAssets = useMemo(
    () => (showComparison ? assets : assets.filter((asset) => asset === symbol)),
    [assets, showComparison, symbol],
  );

  const data = useMemo(
    () => (operation === 'Deposits' ? depositsRates : borrowsRates),
    [operation, depositsRates, borrowsRates],
  );

  const buttons = useMemo(
    () => [
      {
        label: t('DEPOSIT APR'),
        onClick: () => setOperation('Deposits'),
      },
      {
        label: t('BORROW APR'),
        onClick: () => setOperation('Borrows'),
      },
    ],
    [t],
  );

  const formatTimestamp = useCallback((value: string | number) => parseTimestamp(value, 'MMM DD'), []);
  const formatTimestampLabel = useCallback((value: string | number) => `${parseTimestamp(value)}`, []);
  const formatPercentage = useCallback((value: number) => toPercentage(value as number), []);

  const onShowComparisonChange = useCallback(() => {
    setShowComparison((prev) => !prev);
    track('Option Selected', {
      location: 'Yield Chart',
      name: 'show comparison',
      symbol,
      value: !showComparison,
      prevValue: showComparison,
    });
  }, [showComparison, symbol]);

  return (
    <Box display="flex" flexDirection="column" width="100%" height="100%" gap={2}>
      <Box display="flex" justifyContent="space-between">
        <Typography variant="h6" fontSize="16px">
          {t('Current Yield Curves')}
        </Typography>
        <Box>
          <ButtonsChart buttons={buttons} defaultSelected={1} />
        </Box>
      </Box>

      <ResponsiveContainer width="100%" height="100%">
        {loading ? (
          <LoadingChart />
        ) : (
          <AreaChart data={data}>
            <XAxis
              dataKey="maturity"
              type="number"
              stroke="#8f8c9c"
              interval={0}
              padding={{ left: 20, right: 20 }}
              tickFormatter={formatTimestamp}
              domain={[(dataMin: number) => dataMin - 3_600 * 24 * 2, (dataMax: number) => dataMax + 3_600 * 24 * 2]}
              scale="time"
              tick={{ fill: palette.grey[500], fontWeight: 500, fontSize: 11 }}
              allowDataOverflow
              fontSize="12px"
              height={20}
            />
            <YAxis
              tickFormatter={formatPercentage}
              yAxisId="yaxis"
              axisLine={false}
              tick={{ fill: palette.grey[500], fontWeight: 500, fontSize: 11 }}
              tickLine={false}
              domain={[0, (dataMax: number) => 1.5 * dataMax]}
              width={50}
              padding={{ bottom: 8 }}
            />
            <Tooltip
              formatter={(value) => toPercentage(value as number)}
              labelFormatter={formatTimestampLabel}
              content={<TooltipChart />}
            />
            <CartesianGrid stroke={palette.grey[300]} vertical={false} />
            {filteredAssets.map((asset, i) => (
              <Area
                key={asset}
                type="monotone"
                yAxisId="yaxis"
                dataKey={asset}
                stroke={palette.colors[i] || palette.grey[500]}
                strokeWidth={2}
                strokeDasharray={`5 5`}
                strokeDashoffset={filteredAssets.length * i}
                fillOpacity={0.05}
                fill={palette.colors[i] || palette.grey[500]}
                isAnimationActive={false}
                dot={(props) => (
                  <CustomDot
                    {...props}
                    symbol={asset}
                    color={palette.colors[i] || palette.grey[500]}
                    dotsToHighlight={data.map((item) => item[asset])}
                  />
                )}
              />
            ))}
          </AreaChart>
        )}
      </ResponsiveContainer>
      <Box display="flex" alignItems="center" mt={-2.5} pl={1}>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              onChange={onShowComparisonChange}
              sx={{
                color: palette.blue,
                '&.Mui-checked': {
                  color: palette.blue,
                },
              }}
            />
          }
          label={
            <Typography variant="subtitle1" fontSize="12px">
              {t('Compare with other yield curves')}
            </Typography>
          }
        />
      </Box>
    </Box>
  );
};

const CustomDot = ({
  cx,
  cy,
  symbol,
  payload,
  color,
  dotsToHighlight,
}: {
  cx: number;
  cy: number;
  payload: Record<string, number>;
  symbol: string;
  color: string;
  dotsToHighlight?: number[];
}) => {
  const { palette } = useTheme();
  const data = useMemo((): number => payload[symbol], [payload, symbol]);

  if (!dotsToHighlight || !dotsToHighlight.includes(data)) return null;

  return <circle cx={cx} cy={cy} r={5} stroke={color} strokeWidth={2} fill={palette.background.paper} />;
};

export default React.memo(YieldChart);
