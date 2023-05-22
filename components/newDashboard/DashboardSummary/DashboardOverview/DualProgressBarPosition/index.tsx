import React, { FC, useMemo } from 'react';
import DualProgressBar from 'components/common/DualProgressBar';
import { Box, Typography } from '@mui/material';
import formatNumber from 'utils/formatNumber';
import { useTranslation } from 'react-i18next';

export type AssetPosition = {
  symbol: string;
  fixedAssets: number;
  fixedValueUSD: number;
  floatingAssets: number;
  floatingValueUSD: number;
  percentageOfTotal: number;
};

const DualProgressBarPosition: FC<AssetPosition> = ({
  symbol,
  fixedAssets,
  fixedValueUSD,
  floatingAssets,
  floatingValueUSD,
  percentageOfTotal,
}) => {
  const value1 = useMemo(
    () => (fixedValueUSD / (fixedValueUSD + floatingValueUSD)) * percentageOfTotal,
    [fixedValueUSD, floatingValueUSD, percentageOfTotal],
  );
  const value2 = useMemo(
    () => (floatingValueUSD / (fixedValueUSD + floatingValueUSD)) * percentageOfTotal,
    [fixedValueUSD, floatingValueUSD, percentageOfTotal],
  );

  return (
    <DualProgressBar
      value1={value1}
      value2={value2}
      tooltip1={<TooltipContent symbol={symbol} assets={fixedAssets} valueUSD={fixedValueUSD} type="fixed" />}
      tooltip2={<TooltipContent symbol={symbol} assets={floatingAssets} valueUSD={floatingValueUSD} type="variable" />}
    />
  );
};

type TooltipContentProps = {
  symbol: string;
  type: 'fixed' | 'variable';
  assets: number;
  valueUSD: number;
};

const TooltipContent: FC<TooltipContentProps> = ({ symbol, type, assets, valueUSD }) => {
  const { t } = useTranslation();

  return (
    <Box display="flex" flexDirection="column" gap={0.5} alignItems="center">
      <Typography fontWeight={600} fontSize={12} textTransform="uppercase" color={type === 'fixed' ? 'blue' : 'green'}>
        {t(type)?.toUpperCase()}
      </Typography>
      <Typography fontWeight={500} fontSize={13} lineHeight="15.73px" color="grey.700">
        ${formatNumber(valueUSD, 'USD')} | {assets} {symbol}
      </Typography>
    </Box>
  );
};

export default DualProgressBarPosition;
