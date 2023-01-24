import React, { FC, useCallback, useContext, useEffect, useState } from 'react';
import { Zero, WeiPerEther, MaxUint256 } from '@ethersproject/constants';
import { formatFixed } from '@ethersproject/bignumber';
import type { BigNumber } from '@ethersproject/bignumber';
import Grid from '@mui/material/Grid';

import AccountDataContext from 'contexts/AccountDataContext';

import MaturityPoolsTable from './MaturityPoolsTable';
import MaturityPoolInfo from './MaturityPoolInfo';
import { Box } from '@mui/material';
import { globals } from 'styles/theme';
import { APRsPerMaturityType } from 'hooks/useMaturityPools';
import MaturityPoolsMobile from './MaturityPoolsMobile';
import YieldChart from 'components/charts/YieldChart';

const { onlyMobile, onlyDesktop } = globals;

type Rate = {
  maturity: BigNumber;
  rate: BigNumber;
};

type Props = {
  symbol: string;
};

const AssetMaturityPools: FC<Props> = ({ symbol }) => {
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
    <Box display="flex" flexDirection="column" gap="8px">
      <Grid
        container
        width={'100%'}
        boxShadow="0px 4px 12px rgba(175, 177, 182, 0.2)"
        borderRadius="0px 0px 6px 6px"
        bgcolor="white"
        borderTop="4px solid #008CF4"
      >
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
        <Grid item xs={12} px="24px" pb="24px" bgcolor="white" mt={-1} display={onlyDesktop}>
          <MaturityPoolsTable APRsPerMaturity={APRsPerMaturity} symbol={symbol} />
        </Grid>
        <Box display={onlyMobile} px="24px" pt={1} width="100%">
          <MaturityPoolsMobile APRsPerMaturity={APRsPerMaturity} symbol={symbol} />
        </Box>
      </Grid>
      <Box
        boxShadow="0px 4px 12px rgba(175, 177, 182, 0.2)"
        borderRadius="0px 0px 6px 6px"
        bgcolor="white"
        p="16px"
        display={onlyDesktop} // TODO: are we going to have it on mobile?
        width={610}
        height={280}
      >
        <YieldChart />
      </Box>
    </Box>
  );
};

export default AssetMaturityPools;
