import React, { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { WeiPerEther } from '@ethersproject/constants';

import AccountDataContext from 'contexts/AccountDataContext';

import formatNumber from 'utils/formatNumber';
import queryRates from 'utils/queryRates';
import { toPercentage } from 'utils/utils';

import { ItemInfoProps } from 'components/common/ItemInfo';
import HeaderInfo from 'components/common/HeaderInfo';
import OrderAction from 'components/OrderAction';
import { captureException } from '@sentry/nextjs';
import { useWeb3 } from 'hooks/useWeb3';
import networkData from 'config/networkData.json' assert { type: 'json' };
import { Box } from '@mui/material';
import useAccountData from 'hooks/useAccountData';

type FloatingPoolInfoProps = {
  symbol: string;
  eMarketAddress?: string;
};

const FloatingPoolInfo: FC<FloatingPoolInfoProps> = ({ symbol, eMarketAddress }) => {
  const { chain } = useWeb3();
  const { accountData } = useContext(AccountDataContext);

  const { floatingBorrowRate } = useAccountData(symbol);

  const [depositAPR, setDepositAPR] = useState<number | undefined>();

  const { deposited, borrowed } = useMemo(() => {
    if (!accountData) return {};
    const {
      totalFloatingDepositAssets: totalDeposited,
      totalFloatingBorrowAssets: totalBorrowed,
      decimals,
      usdPrice: exchangeRate,
    } = accountData[symbol];

    return {
      deposited: Number(totalDeposited.mul(exchangeRate).div(WeiPerEther)) / 10 ** decimals,
      borrowed: Number(totalBorrowed.mul(exchangeRate).div(WeiPerEther)) / 10 ** decimals,
    };
  }, [accountData, symbol]);

  const fetchAPRs = useCallback(async () => {
    if (!accountData || !eMarketAddress || !chain) return;
    const subgraphUrl = networkData[String(chain.id) as keyof typeof networkData]?.subgraph;
    if (!subgraphUrl) return;
    const { maxFuturePools } = accountData[symbol];

    // TODO: consider storing these results in a new context so it's only fetched once - already added in tech debt docs
    const [{ apr: depositAPRRate }] = await queryRates(subgraphUrl, eMarketAddress, 'deposit', {
      maxFuturePools,
    });
    setDepositAPR(depositAPRRate);
  }, [accountData, eMarketAddress, symbol, chain]);

  useEffect(() => {
    fetchAPRs().catch(captureException);
  }, [fetchAPRs]);

  const borrowAPR = floatingBorrowRate ? toPercentage(Number(floatingBorrowRate) / 1e18) : undefined;

  const itemsInfo: ItemInfoProps[] = [
    {
      label: 'Total Deposits',
      value: deposited != null ? `$${formatNumber(deposited)}` : undefined,
    },
    {
      label: 'Total Borrows',
      value: borrowed != null ? `$${formatNumber(borrowed)}` : undefined,
    },
    {
      label: 'Total Available',
      value: deposited != null && borrowed != null ? `$${formatNumber(deposited - borrowed)}` : undefined,
    },
    {
      label: 'Deposit APR',
      value: toPercentage(depositAPR),
      tooltipTitle: 'Change in the underlying Variable Rate Pool shares value over the last 15 minutes, annualized.',
    },
    {
      label: 'Borrow APR',
      value: borrowAPR,
      tooltipTitle: 'Change in the underlying Variable Rate Pool shares value over the last hour, annualized.',
    },
    {
      label: 'Utilization Rate',
      value: toPercentage(deposited != null && borrowed != null && deposited > 0 ? borrowed / deposited : undefined),
    },
  ];

  return (
    <Box display="flex" justifyContent="space-between" flexDirection="column" gap={2}>
      <HeaderInfo title="Variable Interest Rate" itemsInfo={itemsInfo} shadow={false} xs={4} />
      <Box pb={3} px={3} mt={{ xs: -1, sm: 0 }}>
        <OrderAction symbol={symbol} />
      </Box>
    </Box>
  );
};

export default FloatingPoolInfo;
