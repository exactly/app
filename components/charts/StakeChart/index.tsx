import { Box, Typography, useTheme } from '@mui/material';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toPercentage } from 'utils/utils';
import { useStakedEXAChart } from 'hooks/useStakedEXA';

import LoadingChart from 'components/charts/LoadingChart';
import TooltipChart from 'components/charts/TooltipChart';
import { useStakeEXA } from 'contexts/StakeEXAContext';
import { parseEther } from 'viem';
import WAD from '@exactly/lib/esm/fixed-point-math/WAD';

const StakeChart = () => {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const { totalClaimable, totalClaimed, totalEarned, start, parameters } = useStakeEXA();
  const data = useStakedEXAChart();

  const loading = false;

  const formatDate = useCallback((date: Date, year?: boolean) => {
    return date.toLocaleDateString('en-us', { year: year ? 'numeric' : undefined, month: 'short', day: '2-digit' });
  }, []);

  const now = Math.floor(Date.now() / 1000);

  const claimedPercentage = totalEarned > 0n ? Number(totalClaimed) / Number(totalEarned) : 0;
  const claimablePercentage = totalEarned > 0n ? Number(totalClaimable) / Number(totalEarned) : 0;
  const restValue = Math.max(0, 1 - claimedPercentage - claimablePercentage);

  const processedData = useMemo(() => {
    return data.map((item) => {
      if (item.timestamp <= now) {
        return { ...item, claimedPercentage, claimablePercentage, restValue };
      }
      return item;
    });
  }, [claimablePercentage, claimedPercentage, data, now, restValue]);

  const isEnded = useMemo(() => {
    if (!start || !parameters) return false;
    const avgStart = start === 0n ? parseEther(now.toString()) : start;
    const endTime = Number(avgStart / WAD + parameters.refTime);
    return now > endTime;
  }, [now, parameters, start]);

  return (
    <Box
      p={4}
      borderRadius="16px"
      bgcolor="components.bg"
      boxShadow={() => (palette.mode === 'light' ? '0px 6px 10px 0px rgba(97, 102, 107, 0.20)' : '')}
      display="flex"
      height={400}
    >
      <Box display="flex" flexDirection="column" width="100%" height="100%" gap={2}>
        <Box display="flex" justifyContent="space-between">
          <Typography variant="h6">{t('Staking status')}</Typography>
        </Box>
        <ResponsiveContainer width="100%" height="100%">
          {loading ? (
            <LoadingChart />
          ) : (
            <ComposedChart data={processedData} margin={{ top: 5, bottom: 5 }}>
              <defs>
                <pattern
                  id="claimable"
                  patternUnits="userSpaceOnUse"
                  width="6"
                  height="6"
                  patternTransform="rotate(25)"
                >
                  <rect width="3" height="6" fill={palette.figma.green['500']} />
                  <rect x="3" width="3" height="6" fill="#ffffff" />
                </pattern>
                <pattern id="rest" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(25)">
                  <rect width="3" height="6" fill={isEnded ? 'red' : palette.figma.green['50']} />
                  <rect x="3" width="3" height="6" fill={isEnded ? '#ffffff' : palette.figma.green['50']} />
                </pattern>
                <pattern id="claimed" patternUnits="userSpaceOnUse" width="6" height="6">
                  <rect width="3" height="6" fill={palette.figma.green['500']} />
                  <rect x="3" width="3" height="6" fill={palette.figma.green['500']} />
                </pattern>
              </defs>
              <CartesianGrid horizontal vertical={false} stroke={palette.grey[300]} />
              <XAxis
                xAxisId="date"
                dataKey="timestamp"
                type="number"
                domain={['dataMin', 'dataMax']}
                minTickGap={50}
                padding={{ left: 20, right: 30 }}
                tickFormatter={(value) => formatDate(new Date((value * 1000) as number))}
                stroke="#B4BABF"
                fontSize="12px"
                height={20}
              />
              <YAxis
                yAxisId="left"
                tickFormatter={(tick) => toPercentage(tick, 0)}
                axisLine={false}
                tick={{ fill: palette.grey[500], fontWeight: 500, fontSize: 11 }}
                tickLine={false}
                width={50}
              />
              <Tooltip
                labelFormatter={(value) => formatDate(new Date((value * 1000) as number))}
                formatter={(value) => toPercentage(value as number)}
                content={<TooltipChart itemSorter={(a, b) => (a.value > b.value ? -1 : 1)} />}
              />
              <Area
                yAxisId="left"
                xAxisId="date"
                type="monotone"
                dataKey="claimedPercentage"
                name={t('Claimed')}
                stroke="none"
                fill="url(#claimed)"
                fillOpacity={1}
                dot={false}
                stackId="1"
              />
              <Area
                yAxisId="left"
                xAxisId="date"
                type="monotone"
                dataKey="claimablePercentage"
                name={t('Claimable')}
                stroke="none"
                fill="url(#claimable)"
                fillOpacity={1}
                dot={false}
                stackId="1"
              />
              <Area
                yAxisId="left"
                xAxisId="date"
                type="monotone"
                dataKey="restValue"
                name={isEnded ? t('Not available to claim') : t('Projected Remainder')}
                stroke="none"
                fill="url(#rest)"
                fillOpacity={1}
                dot={false}
                stackId="1"
              />
              <Line
                yAxisId="left"
                xAxisId="date"
                type="monotone"
                dataKey="value"
                name={t('Growth Factor')}
                stroke={palette.mode === 'light' ? 'black' : 'white'}
                dot={false}
                strokeWidth={2}
              />
              <ReferenceLine
                xAxisId="date"
                yAxisId="left"
                x={now}
                stroke={palette.blue}
                strokeDasharray="13 13"
                strokeWidth="3"
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default React.memo(StakeChart);
