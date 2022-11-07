import React, { useContext, useEffect, useMemo, useState } from 'react';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import { Grid } from '@mui/material';
import { Zero } from '@ethersproject/constants';

import { useWeb3Context } from 'contexts/Web3Context';
import AccountDataContext from 'contexts/AccountDataContext';

import { HealthFactor } from 'types/HealthFactor';
import { MaturityPosition } from 'types/FixedLenderAccountData';

import parseHealthFactor from 'utils/parseHealthFactor';
import formatNumber from 'utils/formatNumber';
import getHealthFactorData from 'utils/getHealthFactorData';
import HeaderInfo from 'components/common/HeaderInfo';
import { ItemInfoProps } from 'components/common/ItemInfo';

function DashboardHeader() {
  const { walletAddress } = useWeb3Context();
  const { accountData } = useContext(AccountDataContext);

  const [healthFactor, setHealthFactor] = useState<HealthFactor | undefined>(undefined);

  const [totalDeposited, setTotalDeposited] = useState<BigNumber | undefined>(undefined);
  const [totalBorrowed, setTotalBorrowed] = useState<BigNumber | undefined>(undefined);

  useEffect(() => {
    if (!walletAddress) return;
    getHealthFactor();
  }, [walletAddress, accountData]);

  useEffect(() => {
    if (!accountData) return;

    const { totalDepositedUSD, totalBorrowedUSD } = Object.keys(accountData).reduce(
      (acc, symbol) => {
        const {
          floatingDepositAssets,
          floatingBorrowAssets,
          usdPrice,
          fixedDepositPositions,
          fixedBorrowPositions,
          decimals,
        } = accountData[symbol];
        const WADDecimals = parseFixed('1', decimals);

        // iterate through fixed deposited pools to get totals
        const { fixedTotalDeposited } = fixedDepositPositions.reduce(
          (fixedPoolStats, pool: MaturityPosition) => {
            const { position } = pool;

            fixedPoolStats.fixedTotalDeposited = fixedPoolStats.fixedTotalDeposited.add(position.principal);
            return fixedPoolStats;
          },
          { fixedTotalDeposited: Zero },
        );

        // iterate through fixed borrowed pools to get totals
        const { fixedTotalBorrowed } = fixedBorrowPositions.reduce(
          (fixedPoolStats, pool: MaturityPosition) => {
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

    setTotalDeposited(totalDepositedUSD);
    setTotalBorrowed(totalBorrowedUSD);
  }, [accountData]);

  function getHealthFactor() {
    if (!accountData) return;

    const { collateral, debt } = getHealthFactorData(accountData);

    if (!collateral.isZero() || !debt.isZero()) {
      setHealthFactor({ collateral, debt });
    } else {
      setHealthFactor(undefined);
    }
  }

  const itemsInfo: ItemInfoProps[] = useMemo((): ItemInfoProps[] => {
    return [
      {
        label: 'Your Deposits',
        value: totalDeposited != null ? `$${formatNumber(formatFixed(totalDeposited, 18))}` : undefined,
      },
      {
        label: 'Your Borrows',
        value: totalBorrowed != null ? `$${formatNumber(formatFixed(totalBorrowed, 18))}` : undefined,
      },
      ...(healthFactor
        ? [
            {
              label: 'Health Factor',
              value: healthFactor != null ? parseHealthFactor(healthFactor.debt, healthFactor.collateral) : undefined,
              tooltipTitle:
                'How “safe” is your leverage portfolio, defined as the risk adjusted proportion of collateral deposited versus the risk adjusted amount borrowed. A health factor above 1.25 is recommended to avoid liquidation.',
            },
          ]
        : []),
    ];
  }, [healthFactor, totalBorrowed, totalDeposited]);

  return (
    <Grid item sx={{ alignSelf: 'center', marginRight: '20px' }}>
      <HeaderInfo itemsInfo={itemsInfo} title="Dashboard" />
    </Grid>
  );
}

export default DashboardHeader;
