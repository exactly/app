import React, { useMemo } from 'react';
import { formatUnits } from 'viem';
import { Box, Skeleton, Typography } from '@mui/material';
import WAD from '@exactly/lib/esm/fixed-point-math/WAD';

import { BorrowLimitIcon } from 'components/Icons';
import { useTranslation } from 'react-i18next';
import useHealthFactor from 'hooks/useHealthFactor';
import useAccountData from 'hooks/useAccountData';
import formatNumber from 'utils/formatNumber';

const BorrowLimit = () => {
  const { t } = useTranslation();
  const healthFactor = useHealthFactor();
  const { accountData, isFetching } = useAccountData();

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
      Math.max(0, Number(formatUnits(((((collateral - debt) * WAD) / usdPrice) * adjustFactor) / WAD, 18))).toFixed(
        decimals,
      ),
      'USD',
      false,
    );
  }, [accountData, healthFactor]);

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      py={3}
      px={4}
      gap={3}
      borderRadius="8px"
      boxSizing="border-box"
      bgcolor="components.bg"
    >
      <Box display="flex" gap={1} alignItems="center">
        <BorrowLimitIcon sx={{ fontSize: 16, fill: ({ palette }) => palette.grey[900] }} />
        <Typography variant="dashboardTitle">{t('Borrow Limit')}</Typography>
      </Box>
      {!isFetching && maximumBorrow ? (
        <Typography fontSize={28} fontFamily="IBM Plex Mono">
          ${maximumBorrow}
        </Typography>
      ) : (
        <Skeleton width={100} height={42} />
      )}
    </Box>
  );
};

export default BorrowLimit;
