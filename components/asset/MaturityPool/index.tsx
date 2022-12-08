import React, { FC, useCallback, useContext, useEffect, useState } from 'react';
import { Zero, WeiPerEther, MaxUint256 } from '@ethersproject/constants';
import { formatFixed } from '@ethersproject/bignumber';
import type { BigNumber } from '@ethersproject/bignumber';
import Grid from '@mui/material/Grid';

import AccountDataContext from 'contexts/AccountDataContext';

import MaturityPoolsTable, { APRsPerMaturityType } from './MaturityPoolsTable';
import MaturityPoolInfo from './MaturityPoolInfo';

type Rate = {
  maturity: BigNumber;
  rate: BigNumber;
};

const AssetMaturityPools: FC<{ symbol: string }> = ({ symbol }) => {
  const { accountData } = useContext(AccountDataContext);

  const [totalDeposited, setTotalDeposited] = useState<number | undefined>(undefined);
  const [totalBorrowed, setTotalBorrowed] = useState<number | undefined>(undefined);
  const [bestDeposit, setBestDeposit] = useState<Rate | undefined>(undefined);
  const [bestBorrow, setBestBorrow] = useState<Rate | undefined>(undefined);
  const [APRsPerMaturity, setAPRsPerMaturity] = useState<APRsPerMaturityType>({});

  const getMaturitiesData = useCallback(async () => {
    if (!accountData) return;

    const { fixedPools, usdPrice, decimals } = accountData[symbol];

    setAPRsPerMaturity(
      Object.fromEntries(
        fixedPools.map(({ maturity, depositRate, minBorrowRate }) => [
          maturity,
          { borrow: Number(minBorrowRate.toBigInt()) / 1e18, deposit: Number(depositRate.toBigInt()) / 1e18 },
        ]),
      ),
    );

    let tempTotalDeposited = Zero;
    let tempTotalBorrowed = Zero;
    fixedPools.map(({ borrowed, supplied: deposited }) => {
      tempTotalDeposited = tempTotalDeposited.add(deposited);
      tempTotalBorrowed = tempTotalBorrowed.add(borrowed);
    });

    setTotalDeposited(Number(formatFixed(tempTotalDeposited.mul(usdPrice).div(WeiPerEther), decimals)));
    setTotalBorrowed(Number(formatFixed(tempTotalBorrowed.mul(usdPrice).div(WeiPerEther), decimals)));

    setBestDeposit(
      fixedPools.reduce((best, { maturity, depositRate: rate }) => (rate.gt(best.rate) ? { maturity, rate } : best), {
        maturity: Zero,
        rate: Zero,
      }),
    );
    setBestBorrow(
      fixedPools.reduce((best, { maturity, minBorrowRate: rate }) => (rate.lt(best.rate) ? { maturity, rate } : best), {
        maturity: Zero,
        rate: MaxUint256,
      }),
    );
  }, [accountData, symbol]);

  useEffect(() => void getMaturitiesData(), [getMaturitiesData]);

  return (
    <Grid container mt={4} mb={19} padding={2} sx={{ boxShadow: '#A7A7A7 0px 0px 4px 0px', borderRadius: '5px' }}>
      <Grid item xs={12}>
        <MaturityPoolInfo
          totalDeposited={totalDeposited}
          totalBorrowed={totalBorrowed}
          bestBorrowRate={bestBorrow && Number(bestBorrow.rate) / 1e18}
          bestDepositRate={bestDeposit && Number(bestDeposit.rate) / 1e18}
          bestBorrowMaturity={bestBorrow && Number(bestBorrow.maturity)}
          bestDepositMaturity={bestDeposit && Number(bestDeposit.maturity)}
        />
      </Grid>
      <Grid item xs={12} mt={4}>
        <MaturityPoolsTable APRsPerMaturity={APRsPerMaturity} symbol={symbol} />
      </Grid>
    </Grid>
  );
};

export default AssetMaturityPools;
