import React, { useMemo, type FC } from 'react';
import Grid from '@mui/material/Grid';

import MaturityPoolsTable from './MaturityPoolsTable';
import MaturityPoolInfo from './MaturityPoolInfo';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import MaturityPoolsMobile from './MaturityPoolsMobile';
import YieldChart from 'components/charts/YieldChart';
import UtilizationRateChart from 'components/charts/UtilizationRateChart';
import useAccountData from 'hooks/useAccountData';
import { MAX_UINT256, WEI_PER_ETHER } from 'utils/const';
import { formatUnits } from 'viem';

type Rate = {
  maturity: bigint;
  rate: bigint;
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

    let tempTotalDeposited = 0n;
    let tempTotalBorrowed = 0n;
    fixedPools.forEach(({ borrowed, supplied: deposited }) => {
      tempTotalDeposited = tempTotalDeposited + deposited;
      tempTotalBorrowed = tempTotalBorrowed + borrowed;
    });

    return {
      totalDeposited: Number(formatUnits((tempTotalDeposited * usdPrice) / WEI_PER_ETHER, decimals)),
      totalBorrowed: Number(formatUnits((tempTotalBorrowed * usdPrice) / WEI_PER_ETHER, decimals)),
      bestDeposit: fixedPools.reduce(
        (best, { maturity, depositRate: rate }) => (rate > best.rate ? { maturity, rate } : best),
        {
          maturity: 0n,
          rate: 0n,
        },
      ),
      bestBorrow: fixedPools.reduce(
        (best, { maturity, minBorrowRate: rate }) => (rate < best.rate ? { maturity, rate } : best),
        {
          maturity: 0n,
          rate: MAX_UINT256,
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
