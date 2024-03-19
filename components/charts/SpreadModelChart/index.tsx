import React, { FC, Fragment, useMemo } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { ResponsiveContainer, XAxis, Tooltip, ComposedChart, Area, CartesianGrid, YAxis, Line } from 'recharts';
import dayjs from 'dayjs';

import parseTimestamp from 'utils/parseTimestamp';
import { toPercentage } from 'utils/utils';
import LoadingChart from '../LoadingChart';
import { type Entry } from '../TooltipChart';
import { useTranslation } from 'react-i18next';
import useSpreadModel from 'hooks/useSpreadModel';

type Props = {
  symbol: string;
};

const formatTimestampLabel = (value: number) => (dayjs.unix(value).isToday() ? 'Now' : parseTimestamp(value, 'MMM DD'));
const formatTimestamp = (value: number) => (dayjs.unix(value).isToday() ? 'Now' : parseTimestamp(value));
const formatPercentage = (value: number) => toPercentage(value as number);

const SpreadModel: FC<Props> = ({ symbol }) => {
  const { t } = useTranslation();
  const { palette } = useTheme();

  const { data, levels, loading } = useSpreadModel(symbol);
  const highlights = useMemo(() => data.filter(({ highlight }) => highlight), [data]);
  const ticks = useMemo(
    () => highlights.map((entry) => (Array.isArray(entry.date) ? entry.date[0] : entry.date)),
    [highlights],
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
              scale="auto"
              dataKey="date"
              type="number"
              interval={0}
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatTimestampLabel}
              ticks={ticks}
              allowDataOverflow
              tick={{ fill: palette.grey[500], fontWeight: 500, fontSize: 11 }}
              padding={{ right: 16, left: 16 }}
              fontSize="12px"
              height={20}
            />
            <YAxis
              scale="auto"
              type="number"
              tickFormatter={formatPercentage}
              yAxisId="yaxis"
              axisLine={false}
              tick={{ fill: palette.grey[500], fontWeight: 500, fontSize: 11 }}
              tickLine={false}
              domain={['dataMin', 'dataMax']}
              width={50}
              interval={0}
              tickCount={7}
            />
            <Tooltip content={<CustomTooltip highlights={highlights} highlightColor={palette.colors[0]} />} />
            <CartesianGrid stroke={palette.grey[300]} vertical={false} />
            {[...Array(levels)].map((_, i) => {
              const factor = i / (levels - 1);
              return (
                <Area
                  key={i}
                  type="monotone"
                  xAxisId="xaxis"
                  yAxisId="yaxis"
                  dataKey={`area${i}`}
                  fillOpacity={0.2 + 0.1 * factor}
                  fill={`hsl(0 100% ${50 + 12 * (1 - factor)}%)`}
                  stroke="none"
                  isAnimationActive={false}
                  dot={false}
                  activeDot={false}
                />
              );
            })}
            <Line
              type="monotone"
              xAxisId="xaxis"
              yAxisId="yaxis"
              dataKey="rate"
              connectNulls
              strokeWidth={2}
              strokeDasharray="5 5"
              stroke={palette.text.primary}
              dot={{ r: 5, fill: palette.background.paper, strokeDasharray: '0' }}
              isAnimationActive={false}
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
    const mid = payload?.find((p) => p.dataKey === 'rate')?.payload;
    if (!mid) return undefined;
    const date = mid.date;
    if (Array.isArray(date)) return undefined;
    const entry = highlights.find((e) => {
      const maturity = e.date;
      if (Array.isArray(maturity)) return false;
      return Math.abs(maturity - date) < 86_400;
    });
    return entry;
  }, [highlights, payload]);

  const date = highlight?.date && !Array.isArray(highlight.date) ? t(formatTimestamp(highlight.date)) : undefined;
  const rate = highlight?.rate && !Array.isArray(highlight.rate) ? toPercentage(highlight.rate) : undefined;

  return rate ? (
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
      {(payload || []).map(({ dataKey, value }) => {
        if (dataKey !== 'area0' || !rate) return null;
        if (Array.isArray(value) && value[0] === value[1]) return null;
        return (
          <Fragment key={dataKey}>
            <Typography variant="h6" fontSize="12px">
              {t('Min')}: {Array.isArray(value) ? toPercentage(value[0]) : value}
            </Typography>
            <Typography variant="h6" fontSize="12px">
              {t('Max')}: {Array.isArray(value) ? toPercentage(value[1]) : value}
            </Typography>
          </Fragment>
        );
      })}
    </Box>
  ) : null;
};

export default React.memo(SpreadModel);
