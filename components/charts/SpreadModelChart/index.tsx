import React, { FC, Fragment, useMemo } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import {
  ResponsiveContainer,
  XAxis,
  Tooltip,
  ComposedChart,
  Area,
  CartesianGrid,
  YAxis,
  Line,
  Scatter,
} from 'recharts';

import parseTimestamp from 'utils/parseTimestamp';
import { toPercentage } from 'utils/utils';
import LoadingChart from '../LoadingChart';
import { type Entry } from '../TooltipChart';
import { useTranslation } from 'react-i18next';
import useSpreadModel from 'hooks/useSpreadModel';

type Props = {
  symbol: string;
};

const formatTimestampLabel = (value: string | number) => parseTimestamp(value, 'MMM DD');
const formatTimestamp = (value: string | number) => parseTimestamp(value);
const formatPercentage = (value: number) => toPercentage(value as number);

const SpreadModel: FC<Props> = ({ symbol }) => {
  const { t } = useTranslation();
  const { palette } = useTheme();

  const { data, loading } = useSpreadModel(symbol);
  const highlights = useMemo(() => data.filter((entry, i) => entry.highlight || i === 0), [data]);
  const ticks = useMemo(
    () =>
      data
        .filter((entry, i) => entry.highlight || i === 0)
        .map((entry) => (Array.isArray(entry.date) ? entry.date[0] : entry.date)),
    [data],
  );

  return (
    <Box display="flex" flexDirection="column" width="100%" height="100%" gap={2}>
      <Box display="flex" justifyContent="space-between">
        <Typography variant="h6" fontSize="16px">
          {t('Term Structure of Interest Rates')}
        </Typography>
      </Box>

      <ResponsiveContainer width="100%" height="100%">
        {loading ? (
          <LoadingChart />
        ) : (
          <ComposedChart data={data}>
            <XAxis
              xAxisId="xaxis"
              dataKey="date"
              type="number"
              interval={0}
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatTimestampLabel}
              padding={{ left: 20, right: 20 }}
              ticks={ticks}
              allowDataOverflow
              tick={{ fill: palette.grey[500], fontWeight: 500, fontSize: 11 }}
              fontSize="12px"
              height={20}
            />
            <YAxis
              tickFormatter={formatPercentage}
              yAxisId="yaxis"
              axisLine={false}
              tick={{ fill: palette.grey[500], fontWeight: 500, fontSize: 11 }}
              tickLine={false}
              domain={['dataMin', 'dataMax']}
              width={50}
              padding={{ bottom: 8 }}
            />
            <Tooltip content={<CustomTooltip highlights={highlights} highlightColor={palette.colors[0]} />} />
            <CartesianGrid stroke={palette.grey[300]} vertical={false} />
            <Area
              xAxisId="xaxis"
              type="monotone"
              yAxisId="yaxis"
              dataKey="area"
              strokeWidth={2}
              stroke={palette.mode === 'light' ? 'black' : 'white'}
              fillOpacity={0.05}
              fill={palette.colors[0]}
              strokeDasharray="10 10"
              isAnimationActive={false}
            />
            <Line
              xAxisId="xaxis"
              yAxisId="yaxis"
              dataKey="rate"
              connectNulls
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 5, fill: palette.background.paper, strokeDasharray: '0' }}
            />
            <Scatter
              dataKey="vrate"
              xAxisId="xaxis"
              yAxisId="yaxis"
              fill={palette.mode === 'dark' ? 'white' : 'black'}
            />
          </ComposedChart>
        )}
      </ResponsiveContainer>
    </Box>
  );
};

const CustomTooltip = ({
  payload,
  highlights,
  highlightColor,
}: {
  payload?: (Omit<Entry, 'value'> & { value: number | number[]; payload: Record<string, number | number[]> })[];
  highlights: Record<string, number | number[]>[];
  highlightColor: string;
}) => {
  const { t } = useTranslation();
  const highlight = useMemo(() => {
    const mid = payload?.find((p) => p.dataKey === 'area')?.payload;
    if (!mid) return undefined;
    const date = mid['date'];
    if (Array.isArray(date)) return undefined;
    const entry = highlights.find((e) => {
      const maturity = e['date'];
      if (Array.isArray(maturity)) return false;
      return Math.abs(maturity - date) < 86_400;
    });
    return entry;
  }, [highlights, payload]);

  const date =
    highlight && highlight['date'] && !Array.isArray(highlight['date'])
      ? formatTimestamp(highlight['date'])
      : undefined;
  const rate =
    highlight && highlight['rate'] && !Array.isArray(highlight['rate']) ? toPercentage(highlight['rate']) : undefined;

  const isVR = highlight?.date === highlights[0].date;

  return (
    <Box
      display="flex"
      flexDirection="column"
      border="1px solid #FFFFFF"
      boxShadow="0px 3px 4px rgba(97, 102, 107, 0.1)"
      bgcolor={(theme) => theme.palette.components.bg}
      p="8px"
    >
      {date && (
        <Typography variant="subtitle2" fontSize="10px" mb={0.5}>
          {date}
        </Typography>
      )}
      {rate && (
        <Typography variant="h6" fontSize="12px" color={highlightColor}>
          {t('Rate')}: {rate}
        </Typography>
      )}
      {(payload || []).map(({ dataKey, value, color }) => {
        if (dataKey !== 'area') return null;
        if (isVR) {
          return (
            <Typography key={dataKey} variant="h6" fontSize="12px" color={color}>
              {t('Variable Rate')}: {Array.isArray(value) ? toPercentage(value[0]) : value}
            </Typography>
          );
        }
        return (
          <Fragment key={dataKey}>
            <Typography variant="h6" fontSize="12px" color={color}>
              {t('Min')}: {Array.isArray(value) ? toPercentage(value[0]) : value}
            </Typography>
            <Typography variant="h6" fontSize="12px" color={color}>
              {t('Max')}: {Array.isArray(value) ? toPercentage(value[1]) : value}
            </Typography>
          </Fragment>
        );
      })}
    </Box>
  );
};

export default React.memo(SpreadModel);
