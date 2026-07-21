import { Box, Checkbox, FormControlLabel, Typography, useTheme } from '@mui/material';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { formatEther, formatUnits } from 'viem';
import { usePublicClient } from 'wagmi';
import { floatingDepositRates } from '@exactly/lib';

import { ratePreviewerAbi, ratePreviewerAddress, ratePreviewerCode } from 'generated/wagmi';
import usePreviewerExactly from 'hooks/usePreviewerExactly';
import { useGlobalError } from 'contexts/GlobalErrorContext';
import { defaultChain } from 'utils/client';
import formatNumber from 'utils/formatNumber';
import { toPercentage } from 'utils/utils';
import { track } from 'utils/mixpanel';
import ButtonsChart from '../ButtonsChart';
import LoadingChart from '../LoadingChart';
import TooltipChart from '../TooltipChart';

type Props = {
  symbol: string;
};

type Range = '1W' | '2W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

const WINDOW_SECONDS: Record<Exclude<Range, 'ALL'>, number> = {
  '1W': 7 * 86_400,
  '2W': 14 * 86_400,
  '1M': 30 * 86_400,
  '3M': 90 * 86_400,
  '6M': 180 * 86_400,
  '1Y': 365 * 86_400,
};
const SECONDS_PER_BLOCK: Record<number, number> = { 1: 12, 10: 2, 8453: 2, 11_155_420: 2, 84_532: 2 };
const POINTS = 30;
const CONCURRENCY = 8;

const HistoricalRateChart: FC<Props> = ({ symbol }) => {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const { setLoadError } = useGlobalError();
  const [showDeposits, setShowDeposits] = useState(true);
  const [range, setRange] = useState<Range>('6M');

  const marketAccount = usePreviewerExactly().data?.find((market) => market.assetSymbol === symbol);
  const market = marketAccount?.market;
  const client = usePublicClient({ chainId: defaultChain.id });
  const ratePreviewer = ratePreviewerAddress[defaultChain.id as keyof typeof ratePreviewerAddress];
  const code = ratePreviewerCode[defaultChain.id as keyof typeof ratePreviewerCode];

  const {
    data: points = [],
    isFetching,
    isError,
  } = useQuery({
    queryKey: ['historicalRates', defaultChain.id, market, range],
    enabled: Boolean(client && market && ratePreviewer && code),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      if (!client || !market || !marketAccount || !ratePreviewer || !code) return [];

      const blockTime = SECONDS_PER_BLOCK[defaultChain.id] ?? 2;
      const latest = await client.getBlockNumber();
      const anchor = Number((await client.getBlock({ blockNumber: latest })).timestamp);
      const snapshotAt = (blockNumber: bigint) =>
        client.readContract({
          address: ratePreviewer,
          abi: ratePreviewerAbi,
          functionName: 'snapshot',
          blockNumber,
          stateOverride: [{ address: ratePreviewer, code }],
        });
      let from = 1n;
      if (range === 'ALL') {
        let low = 1n;
        let high = latest;
        while (low < high) {
          const middle = (low + high) / 2n;
          try {
            if ((await snapshotAt(middle)).some((state) => state.market.toLowerCase() === market.toLowerCase())) {
              high = middle;
            } else low = middle + 1n;
          } catch {
            low = middle + 1n;
          }
        }
        from = low;
      } else {
        const span = BigInt(Math.ceil(WINDOW_SECONDS[range] / blockTime));
        from = latest > span ? latest - span : 1n;
      }
      const width = latest - from;
      const count = width < BigInt(POINTS) ? Number(width) + 1 : POINTS;
      const blocks = [
        ...new Set(
          Array.from({ length: count }, (_, i) => from + (width * BigInt(i)) / BigInt(Math.max(count - 1, 1))),
        ),
      ];

      const series: { date: number; depositApr: number; borrowApr: number; deposits: number }[] = [];
      for (let i = 0; i < blocks.length; i += CONCURRENCY) {
        const batch = await Promise.allSettled(
          blocks.slice(i, i + CONCURRENCY).map(async (blockNumber) => {
            const snapshot = await snapshotAt(blockNumber);
            const state = snapshot.find((s) => s.market.toLowerCase() === market.toLowerCase());
            if (!state) return undefined;
            const timestamp = anchor - Number(latest - blockNumber) * blockTime;
            const deposit = floatingDepositRates(
              [
                {
                  ...state,
                  lastFloatingDebtUpdate: Number(state.lastFloatingDebtUpdate),
                  lastAccumulatorAccrual: Number(state.lastAccumulatorAccrual),
                  maxFuturePools: Number(state.maxFuturePools),
                },
              ],
              timestamp,
            )[0];
            return {
              date: timestamp * 1_000,
              depositApr: deposit ? Number(formatEther(deposit.rate)) : 0,
              borrowApr: Number(formatEther(state.floatingRate)),
              deposits: Number(formatUnits(state.totalAssets, marketAccount.decimals)),
            };
          }),
        );
        for (const result of batch) if (result.status === 'fulfilled' && result.value) series.push(result.value);
      }

      return series.sort((a, b) => a.date - b.date);
    },
  });

  const loading = isFetching || !marketAccount;

  useEffect(() => {
    if (isError) setLoadError();
  }, [isError, setLoadError]);

  const buttons = useMemo(
    () => [
      { label: t('1W'), onClick: () => setRange('1W') },
      { label: t('2W'), onClick: () => setRange('2W') },
      { label: t('1M'), onClick: () => setRange('1M') },
      { label: t('3M'), onClick: () => setRange('3M') },
      { label: t('6M'), onClick: () => setRange('6M') },
      { label: t('1Y'), onClick: () => setRange('1Y') },
      { label: t('All'), onClick: () => setRange('ALL') },
    ],
    [t],
  );

  const formatDate = useCallback(
    (date: Date, year?: boolean, time?: boolean) =>
      `${date.toLocaleDateString('en-us', {
        year: year ? 'numeric' : undefined,
        month: 'short',
        day: '2-digit',
      })}${time ? `, ${date.toLocaleTimeString('en-us', { timeStyle: 'short', hour12: false })}` : ''}`,
    [],
  );

  const onShowDepositsChange = useCallback(() => {
    setShowDeposits((prev) => !prev);
    track('Option Selected', {
      name: 'show total deposits',
      location: 'Historical Rate Chart',
      symbol,
      value: !showDeposits,
      prevValue: showDeposits,
    });
  }, [showDeposits, symbol]);

  return (
    <Box
      data-testid="historical-rate-chart"
      data-point-count={points.length}
      display="flex"
      flexDirection="column"
      width="100%"
      height="100%"
      gap={1}
    >
      <Box display="flex" justifyContent="space-between">
        <Typography variant="h6" fontSize="16px">
          {t('Historical Variable Rates')}
        </Typography>
        <Box>
          <ButtonsChart buttons={buttons} defaultSelected={4} />
        </Box>
      </Box>
      <Box position="relative" flex={1} minWidth={0} minHeight={0}>
        <LineChart responsive style={{ width: '100%', height: '100%' }} data={points} margin={{ top: 2 }}>
          <CartesianGrid yAxisId="left" horizontal vertical={false} stroke={palette.grey[300]} />
          <XAxis
            dataKey="date"
            type="number"
            domain={['dataMin', 'dataMax']}
            minTickGap={50}
            padding={{ left: 8, right: 8 }}
            tickFormatter={(value) =>
              formatDate(new Date(value as number), range === '6M' || range === '1Y' || range === 'ALL')
            }
            stroke="#B4BABF"
            fontSize="12px"
            height={20}
          />
          <YAxis
            yAxisId="left"
            domain={['auto', 'auto']}
            tickFormatter={(tick) => toPercentage(tick).replace(/(\.\d*?[1-9])0+(?=\D*$)|\.0+(?=\D*$)/, '$1')}
            axisLine={false}
            tick={{ fill: palette.grey[500], fontWeight: 500, fontSize: 11 }}
            tickLine={false}
            width="auto"
          />
          {showDeposits && (
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={['auto', 'auto']}
              tickFormatter={(value) =>
                formatNumber(value as number, symbol).replace(/(\.\d*?[1-9])0+(?=\D*$)|\.0+(?=\D*$)/, '$1')
              }
              tick={{ fill: palette.blue, fontWeight: 500, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width="auto"
            />
          )}
          <Tooltip
            active={loading ? false : undefined}
            labelFormatter={(value) => formatDate(new Date(value as number), true, range === '1W' || range === '2W')}
            content={
              <TooltipChart
                formatter={(value, { dataKey }) =>
                  dataKey === 'deposits' ? `${formatNumber(value, symbol)} ${symbol}` : toPercentage(value)
                }
              />
            }
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="depositApr"
            name={t('Deposit APR')}
            stroke={palette.mode === 'light' ? 'black' : 'white'}
            dot={false}
            strokeWidth={2}
            animationDuration={300}
            animationEasing="ease-out"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="borrowApr"
            name={t('Borrow APR')}
            stroke={palette.green}
            dot={false}
            strokeWidth={2}
            animationDuration={300}
            animationEasing="ease-out"
          />
          {showDeposits && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="deposits"
              name={t('Total Deposits')}
              stroke={palette.blue}
              dot={false}
              strokeDasharray="5 5"
              animationDuration={300}
              animationEasing="ease-out"
            />
          )}
        </LineChart>
        {loading ? (
          <LoadingChart overlay />
        ) : points.length < 2 ? (
          <Box position="absolute" display="flex" alignItems="center" justifyContent="center" sx={{ inset: 0 }}>
            <Typography color="grey.500" variant="subtitle2" fontSize="14px">
              {t('Not enough variable rate activity to chart yet.')}
            </Typography>
          </Box>
        ) : null}
      </Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
        <Box data-testid="historical-rate-chart-legend" display="flex" alignItems="center" gap={1.5}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box
              width={16}
              flexShrink={0}
              borderTop="2px solid"
              borderColor={palette.mode === 'light' ? 'black' : 'white'}
            />
            <Typography variant="subtitle1" fontSize="10px" lineHeight={1} whiteSpace="nowrap">
              {t('Deposit APR')}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box width={16} flexShrink={0} borderTop="2px solid" borderColor={palette.green} />
            <Typography variant="subtitle1" fontSize="10px" lineHeight={1} whiteSpace="nowrap">
              {t('Borrow APR')}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5} sx={{ opacity: showDeposits ? 1 : 0.4 }}>
            <Box width={16} flexShrink={0} borderTop="2px dashed" borderColor={palette.blue} />
            <Typography variant="subtitle1" fontSize="10px" lineHeight={1} whiteSpace="nowrap">
              {t('Total Deposits')}
            </Typography>
          </Box>
        </Box>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={showDeposits}
              onChange={onShowDepositsChange}
              sx={{ px: 0.25, pt: 0.25, pb: 0, color: palette.blue, '&.Mui-checked': { color: palette.blue } }}
            />
          }
          label={
            <Typography variant="subtitle1" fontSize="12px" lineHeight={1}>
              {t('Show total deposits')}
            </Typography>
          }
          labelPlacement="start"
          sx={{ m: 0, gap: 0.5 }}
        />
      </Box>
    </Box>
  );
};

export default React.memo(HistoricalRateChart);
