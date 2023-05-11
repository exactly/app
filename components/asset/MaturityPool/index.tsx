import React, { useMemo, type FC } from 'react';
import { Zero, WeiPerEther, MaxUint256 } from '@ethersproject/constants';
import { formatFixed } from '@ethersproject/bignumber';
import type { BigNumber } from '@ethersproject/bignumber';
import Grid from '@mui/material/Grid';

import MaturityPoolsTable from './MaturityPoolsTable';
import MaturityPoolInfo from './MaturityPoolInfo';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import MaturityPoolsMobile from './MaturityPoolsMobile';
import YieldChart from 'components/charts/YieldChart';
import UtilizationRateChart from 'components/charts/UtilizationRateChart';
import useAccountData from 'hooks/useAccountData';

type Rate = {
  maturity: BigNumber;
  rate: BigNumber;
};

type Props = {
  symbol: string;
};

const AssetMaturityPools: FC<Props> = ({ symbol }) => {
  const { marketAccount } = useAccountData(symbol);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { totalDeposited, totalBorrowed, bestDeposit, bestBorrow } = useMemo<{
    totalDeposited?: number;
    totalBorrowed?: number;
    bestDeposit?: Rate;
    bestBorrow?: Rate;
  }>(() => {
    if (!marketAccount) return {};

    const { fixedPools, usdPrice, decimals } = marketAccount;

    let tempTotalDeposited = Zero;
    let tempTotalBorrowed = Zero;
    fixedPools.map(({ borrowed, supplied: deposited }) => {
      tempTotalDeposited = tempTotalDeposited.add(deposited);
      tempTotalBorrowed = tempTotalBorrowed.add(borrowed);
    });

    return {
      totalDeposited: Number(formatFixed(tempTotalDeposited.mul(usdPrice).div(WeiPerEther), decimals)),
      totalBorrowed: Number(formatFixed(tempTotalBorrowed.mul(usdPrice).div(WeiPerEther), decimals)),
      bestDeposit: fixedPools.reduce(
        (best, { maturity, depositRate: rate }) => (rate.gt(best.rate) ? { maturity, rate } : best),
        {
          maturity: Zero,
          rate: Zero,
        },
      ),
      bestBorrow: fixedPools.reduce(
        (best, { maturity, minBorrowRate: rate }) => (rate.lt(best.rate) ? { maturity, rate } : best),
        {
          maturity: Zero,
          rate: MaxUint256,
        },
      ),
    };
  }, [marketAccount]);

  return (
    <Box display="flex" flexDirection="column" gap="8px">
      <Grid
        container
        width={'100%'}
        boxShadow="0px 4px 12px rgba(175, 177, 182, 0.2)"
        borderRadius="0px 0px 6px 6px"
        bgcolor="components.bg"
        borderTop="4px solid #008CF4"
      >
        <Grid item xs={12}>
          <MaturityPoolInfo
            symbol={symbol}
            totalDeposited={totalDeposited}
            totalBorrowed={totalBorrowed}
            bestBorrowRate={bestBorrow && Number(bestBorrow.rate) / 1e18}
            bestDepositRate={bestDeposit && Number(bestDeposit.rate) / 1e18}
            bestBorrowMaturity={bestBorrow && Number(bestBorrow.maturity)}
            bestDepositMaturity={bestDeposit && Number(bestDeposit.maturity)}
            adjustFactor={marketAccount && marketAccount.adjustFactor}
          />
        </Grid>
        {isMobile ? (
          <Box px="24px" pt={1} width="100%">
            <MaturityPoolsMobile symbol={symbol} />
          </Box>
        ) : (
          <Grid item xs={12} px="24px" pb="24px" bgcolor="components.bg" mt={-1}>
            <MaturityPoolsTable symbol={symbol} />
          </Grid>
        )}
      </Grid>
      <Box
        boxShadow="0px 4px 12px rgba(175, 177, 182, 0.2)"
        borderRadius="0px 0px 6px 6px"
        bgcolor="components.bg"
        p="16px"
        height={280}
      >
        <YieldChart symbol={symbol} />
      </Box>
      <Box
        boxShadow="0px 4px 12px rgba(175, 177, 182, 0.2)"
        borderRadius="0px 0px 6px 6px"
        bgcolor="components.bg"
        p="16px"
        height={280}
      >
        <UtilizationRateChart type="fixed" symbol={symbol} />
      </Box>
    </Box>
  );
};

export default AssetMaturityPools;
