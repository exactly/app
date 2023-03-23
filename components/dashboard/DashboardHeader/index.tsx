import React, { useMemo } from 'react';
import { formatFixed } from '@ethersproject/bignumber';
import { Box, Grid } from '@mui/material';

import parseHealthFactor from 'utils/parseHealthFactor';
import formatNumber from 'utils/formatNumber';
import HeaderInfo from 'components/common/HeaderInfo';
import { ItemInfoProps } from 'components/common/ItemInfo';
import { useWeb3 } from 'hooks/useWeb3';
import useHealthFactor from 'hooks/useHealthFactor';
import useAccountData from 'hooks/useAccountData';
import { useTranslation } from 'react-i18next';
import useTotalsUsd from 'hooks/useTotalsUsd';
import AssetsDistributionPieChart from 'components/charts/AssetsDistributionPieChart';

function DashboardHeader() {
  const { t } = useTranslation();
  const { walletAddress } = useWeb3();
  const { totalDepositedUSD, totalBorrowedUSD } = useTotalsUsd();
  const healthFactor = useHealthFactor();

  const itemsInfo: ItemInfoProps[] = useMemo((): ItemInfoProps[] => {
    return [
      {
        label: t('Your Deposits'),
        value: totalDepositedUSD ? `$${formatNumber(formatFixed(totalDepositedUSD, 18))}` : undefined,
      },
      {
        label: t('Your Borrows'),
        value: totalBorrowedUSD ? `$${formatNumber(formatFixed(totalBorrowedUSD, 18))}` : undefined,
      },
      ...(healthFactor && walletAddress
        ? [
            {
              label: t('Health Factor'),
              value: healthFactor ? parseHealthFactor(healthFactor.debt, healthFactor.collateral) : undefined,
              tooltipTitle: t(
                'The Health Factor represents how “safe” your leverage portfolio is, defined as the risk-adjusted proportion of collateral deposited versus the borrowed risk-adjusted amount. A health factor below 1x will be considered with a shortfall and open to liquidation.',
              ),
            },
          ]
        : []),
    ];
  }, [healthFactor, totalBorrowedUSD, totalDepositedUSD, walletAddress, t]);

  return (
    <Grid
      sx={{ alignSelf: 'center' }}
      display="flex"
      bgcolor="components.bg"
      justifyContent={'space-between'}
      boxShadow={'0px 4px 12px rgba(175, 177, 182, 0.2)'}
    >
      <Box>
        <HeaderInfo itemsInfo={itemsInfo} title="Dashboard" shadow={false} />
      </Box>
      <Box display="flex" marginRight={2}>
        <AssetsDistributionPieChart type="deposit" />
        <AssetsDistributionPieChart type="borrow" />
      </Box>
    </Grid>
  );
}

export default DashboardHeader;
