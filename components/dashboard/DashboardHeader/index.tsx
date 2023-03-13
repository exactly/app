import React, { useMemo } from 'react';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import { Grid } from '@mui/material';
import { Zero } from '@ethersproject/constants';

import parseHealthFactor from 'utils/parseHealthFactor';
import formatNumber from 'utils/formatNumber';
import HeaderInfo from 'components/common/HeaderInfo';
import { ItemInfoProps } from 'components/common/ItemInfo';
import { useWeb3 } from 'hooks/useWeb3';
import useHealthFactor from 'hooks/useHealthFactor';
import useAccountData from 'hooks/useAccountData';

function DashboardHeader() {
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
        label: 'Your Deposits',
        value: totalDeposited ? `$${formatNumber(formatFixed(totalDeposited, 18))}` : undefined,
      },
      {
        label: 'Your Borrows',
        value: totalBorrowed ? `$${formatNumber(formatFixed(totalBorrowed, 18))}` : undefined,
      },
      ...(healthFactor && walletAddress
        ? [
            {
              label: 'Health Factor',
              value: healthFactor ? parseHealthFactor(healthFactor.debt, healthFactor.collateral) : undefined,
              tooltipTitle:
                'How “safe” is your leverage portfolio, defined as the risk adjusted proportion of collateral deposited versus the risk adjusted amount borrowed. A health factor above 1.25 is recommended to avoid liquidation.',
            },
          ]
        : []),
    ];
  }, [healthFactor, totalBorrowed, totalDeposited, walletAddress]);

  return (
    <Grid item sx={{ alignSelf: 'center' }} width="100%">
      <HeaderInfo itemsInfo={itemsInfo} title="Dashboard" />
    </Grid>
  );
}

export default DashboardHeader;
