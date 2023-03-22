import React, { useMemo } from 'react';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import { Box, Grid } from '@mui/material';
import { Zero } from '@ethersproject/constants';

import parseHealthFactor from 'utils/parseHealthFactor';
import formatNumber from 'utils/formatNumber';
import HeaderInfo from 'components/common/HeaderInfo';
import { ItemInfoProps } from 'components/common/ItemInfo';
import { useWeb3 } from 'hooks/useWeb3';
import useHealthFactor from 'hooks/useHealthFactor';
import useAccountData from 'hooks/useAccountData';
import { useTranslation } from 'react-i18next';
import AssetsDistributionPieChart from 'components/charts/AssetsDistributionPieChart';

function DashboardHeader() {
  const { t } = useTranslation();
  const { walletAddress } = useWeb3();
  const { accountData } = useAccountData();

  const healthFactor = useHealthFactor();

  const { totalDeposited, totalBorrowed } = useMemo<{
    totalDeposited?: BigNumber;
    totalBorrowed?: BigNumber;
  }>(() => {
    if (!accountData) return {};

    const { totalDepositedUSD, totalBorrowedUSD } = accountData.reduce(
      (
        acc,
        {
          floatingDepositAssets,
          floatingBorrowAssets,
          usdPrice,
          fixedDepositPositions,
          fixedBorrowPositions,
          decimals,
        },
      ) => {
        const WADDecimals = parseFixed('1', decimals);

        // iterate through fixed deposited pools to get totals
        const { fixedTotalDeposited } = fixedDepositPositions.reduce(
          (fixedPoolStats, pool) => {
            const { position } = pool;

            fixedPoolStats.fixedTotalDeposited = fixedPoolStats.fixedTotalDeposited.add(position.principal);
            return fixedPoolStats;
          },
          { fixedTotalDeposited: Zero },
        );

        // iterate through fixed borrowed pools to get totals
        const { fixedTotalBorrowed } = fixedBorrowPositions.reduce(
          (fixedPoolStats, pool) => {
            const { position } = pool;

            fixedPoolStats.fixedTotalBorrowed = fixedPoolStats.fixedTotalBorrowed.add(position.principal);
            return fixedPoolStats;
          },
          { fixedTotalBorrowed: Zero },
        );

        acc.totalDepositedUSD = acc.totalDepositedUSD.add(
          floatingDepositAssets.add(fixedTotalDeposited).mul(usdPrice).div(WADDecimals),
        );
        acc.totalBorrowedUSD = acc.totalBorrowedUSD.add(
          floatingBorrowAssets.add(fixedTotalBorrowed).mul(usdPrice).div(WADDecimals),
        );
        return acc;
      },
      { totalDepositedUSD: Zero, totalBorrowedUSD: Zero },
    );

    return { totalDeposited: totalDepositedUSD, totalBorrowed: totalBorrowedUSD };
  }, [accountData]);

  const itemsInfo: ItemInfoProps[] = useMemo((): ItemInfoProps[] => {
    return [
      {
        label: t('Your Deposits'),
        value: totalDeposited ? `$${formatNumber(formatFixed(totalDeposited, 18))}` : undefined,
      },
      {
        label: t('Your Borrows'),
        value: totalBorrowed ? `$${formatNumber(formatFixed(totalBorrowed, 18))}` : undefined,
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
  }, [healthFactor, totalBorrowed, totalDeposited, walletAddress, t]);

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
