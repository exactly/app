import React, { FC, useMemo } from 'react';
import DualProgressBar from 'components/common/DualProgressBar';
import { Box, Typography } from '@mui/material';
import formatNumber from 'utils/formatNumber';
import { useTranslation } from 'react-i18next';
import { WEI_PER_ETHER } from 'utils/const';
import { formatUnits } from 'viem';

export type AssetPosition = {
  symbol: string;
  decimals: number;
  fixedAssets: bigint;
  fixedValueUSD: bigint;
  floatingAssets: bigint;
  floatingValueUSD: bigint;
  percentageOfTotal: bigint;
};

const DualProgressBarPosition: FC<AssetPosition> = ({
  symbol,
  decimals,
  fixedAssets,
  fixedValueUSD,
  floatingAssets,
  floatingValueUSD,
  percentageOfTotal,
}) => {
  const totalValueUSD = useMemo(() => fixedValueUSD + floatingValueUSD, [fixedValueUSD, floatingValueUSD]);

  const value1 = useMemo(
    () =>
      totalValueUSD === 0n
        ? 0
        : Number(((((fixedValueUSD * WEI_PER_ETHER) / totalValueUSD) * percentageOfTotal) / WEI_PER_ETHER) * 100n) /
          1e18,
    [fixedValueUSD, percentageOfTotal, totalValueUSD],
  );

  const value2 = useMemo(
    () =>
      totalValueUSD === 0n
        ? 0
        : Number(((((floatingValueUSD * WEI_PER_ETHER) / totalValueUSD) * percentageOfTotal) / WEI_PER_ETHER) * 100n) /
          1e18,
    [floatingValueUSD, percentageOfTotal, totalValueUSD],
  );

  return (
    <DualProgressBar
      value1={value1}
      value2={value2}
      tooltip1={
        <TooltipContent
          symbol={symbol}
          assets={formatNumber(formatUnits(fixedAssets, decimals), symbol)}
          valueUSD={formatNumber(formatUnits(fixedValueUSD, 18), 'USD')}
          type="fixed"
        />
      }
      tooltip2={
        <TooltipContent
          symbol={symbol}
          assets={formatNumber(formatUnits(floatingAssets, decimals), symbol)}
          valueUSD={formatNumber(formatUnits(floatingValueUSD, 18), 'USD')}
          type="variable"
        />
      }
    />
  );
};

type TooltipContentProps = {
  symbol: string;
  type: 'fixed' | 'variable';
  assets: string;
  valueUSD: string;
};

const TooltipContent: FC<TooltipContentProps> = ({ symbol, type, assets, valueUSD }) => {
  const { t } = useTranslation();

  return (
    <Box display="flex" flexDirection="column" gap={0.5} alignItems="center">
      <Typography fontWeight={600} fontSize={12} textTransform="uppercase" color={type === 'fixed' ? 'blue' : 'green'}>
        {t(type)?.toUpperCase()}
      </Typography>
      <Typography fontWeight={500} fontSize={13} lineHeight="15.73px" color="grey.700">
        ${valueUSD} | {assets} {symbol}
      </Typography>
    </Box>
  );
};

export default DualProgressBarPosition;
