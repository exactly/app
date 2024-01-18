import React, { CSSProperties, FC, Fragment, useCallback, useMemo, useState } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import {
  ResponsiveContainer,
  XAxis,
  Tooltip,
  Scatter,
  ComposedChart,
  Area,
  CartesianGrid,
  YAxis,
  Line,
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

const formatTimestampLabel = (value: string | number) => parseTimestamp(value);
const formatPercentage = (value: number) => toPercentage(value as number);

const SpreadModel: FC<Props> = ({ symbol }) => {
  const { t } = useTranslation();
  const { palette } = useTheme();

  const [cursor, setCursor] = useState<CSSProperties['cursor']>('default');
  const handleMouseEnter = () => {
    setCursor('pointer');
  };
  const handleMouseLeave = () => {
    setCursor('default');
  };

  const { data, loading } = useSpreadModel(symbol);
  const highlights = useMemo(() => data.filter((entry) => entry.highlight), [data]);

  return (
    <Box display="flex" flexDirection="column" width="100%" height="100%" gap={2}>
      <Box display="flex" justifyContent="space-between">
        <Typography variant="h6" fontSize="16px">
          {t('Spread Model')}
        </Typography>
      </Box>

      <ResponsiveContainer width="100%" height="100%">
        {loading ? (
          <LoadingChart />
        ) : (
          <ComposedChart data={data} style={{ cursor }}>
            <XAxis
              dataKey="maturity"
              type="number"
              stroke="#8f8c9c"
              interval={0}
              padding={{ left: 10, right: 10 }}
              domain={[0, 1]}
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
              domain={['dataMin', 'dataMax']}
              width={50}
              padding={{ bottom: 8 }}
            />
            <Tooltip content={<CustomTooltip highlights={highlights} highlightColor={palette.colors[0]} />} />
            <CartesianGrid stroke={palette.grey[300]} vertical={false} />
            <Line
              dataKey="mid"
              dot={false}
              yAxisId="yaxis"
              type="monotone"
              stroke={palette.colors[0]}
              strokeWidth={2}
              isAnimationActive={false}
              activeDot={false}
            />
            <Area
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
            <Scatter
              yAxisId="yaxis"
              dataKey="rate"
              shape={(props) => (
                <CustomDot
                  {...props}
                  color={palette.colors[0]}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                />
              )}
            />
          </ComposedChart>
        )}
      </ResponsiveContainer>
    </Box>
  );
};

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
  payload: Record<string, number>;
  color: string;
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

const CustomTooltip = ({
  payload,
  highlights,
  highlightColor,
}: {
  payload?: (Omit<Entry, 'value'> & { value: number | number[]; payload: Record<string, number | number[]> })[];
  highlights: Record<string, number | number[]>[];
  highlightColor: string;
}) => {
  const highlight = useMemo(() => {
    const mid = payload?.find((p) => p.dataKey === 'mid')?.payload;
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
      ? formatTimestampLabel(highlight['date'])
      : undefined;
  const rate =
    highlight && highlight['rate'] && !Array.isArray(highlight['rate']) ? toPercentage(highlight['rate']) : undefined;

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
          Rate: {rate}
        </Typography>
      )}
      {(payload || []).map(({ dataKey, value, color }) => {
        if (dataKey !== 'area') return null;
        return (
          <Fragment key={dataKey}>
            <Typography variant="h6" fontSize="12px" color={color}>
              Min: {Array.isArray(value) ? toPercentage(value[0]) : value}
            </Typography>
            <Typography variant="h6" fontSize="12px" color={color}>
              Max: {Array.isArray(value) ? toPercentage(value[1]) : value}
            </Typography>
          </Fragment>
        );
      })}
    </Box>
  );
};

export default React.memo(SpreadModel);
