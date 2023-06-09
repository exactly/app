import React, { useMemo } from 'react';
import { formatUnits } from 'viem';
import { Box, Skeleton, Typography, useMediaQuery, useTheme } from '@mui/material';
import { BorrowLimitIcon } from 'components/Icons';
import { useTranslation } from 'react-i18next';
import useHealthFactor from 'hooks/useHealthFactor';
import useAccountData from 'hooks/useAccountData';
import formatNumber from 'utils/formatNumber';
import { WEI_PER_ETHER } from 'utils/const';

const BorrowLimit = () => {
  const { t } = useTranslation();
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('lg'));
  const healthFactor = useHealthFactor();
  const { accountData } = useAccountData();

  const maximumBorrow = useMemo((): string => {
    if (!accountData || !healthFactor) return '';

    const marketAccount = accountData
      .map(({ adjustFactor, usdPrice, decimals }) => ({
        adjustFactor,
        usdPrice,
        decimals,
      }))
      .reduce((acc: { adjustFactor: bigint; usdPrice: bigint; decimals: number }, curr) => {
        if (curr.adjustFactor > acc.adjustFactor) {
          acc = curr;
        }
        return acc;
      });

    const { adjustFactor, usdPrice, decimals } = marketAccount;
    const { debt, collateral } = healthFactor;

    return formatNumber(
      Math.max(
        0,
        Number(formatUnits(((((collateral - debt) * WEI_PER_ETHER) / usdPrice) * adjustFactor) / WEI_PER_ETHER, 18)),
      ).toFixed(decimals),
      'USD',
      false,
    );
  }, [accountData, healthFactor]);

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      py={2}
      px={4}
      gap={3}
      borderRadius="8px"
      boxSizing="border-box"
      bgcolor="components.bg"
      height={{ xs: '73px', lg: '64px' }}
    >
      <Box display="flex" gap={1} alignItems="center">
        <BorrowLimitIcon sx={{ fontSize: 16 }} />
        <Typography variant="dashboardTitle">{t('Borrow Limit')}</Typography>
      </Box>
      {maximumBorrow ? (
        <Typography variant={isMobile ? 'dashboardOverviewAmount' : 'h6'}>${maximumBorrow}</Typography>
      ) : (
        <Skeleton width={64} height={32} />
      )}
    </Box>
  );
};

export default BorrowLimit;
