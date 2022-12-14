import React, { FC, useCallback, useContext, useEffect, useState } from 'react';
import { formatFixed } from '@ethersproject/bignumber';
import { WeiPerEther } from '@ethersproject/constants';

import LangContext from 'contexts/LangContext';
import AccountDataContext from 'contexts/AccountDataContext';

import { LangKeys } from 'types/Lang';

import keys from './translations.json';

import formatNumber from 'utils/formatNumber';
import queryRates from 'utils/queryRates';
import { toPercentage } from 'utils/utils';

import { ItemInfoProps } from 'components/common/ItemInfo';
import HeaderInfo from 'components/common/HeaderInfo';
import Grid from '@mui/material/Grid';
import OrderAction from 'components/OrderAction';
import { captureException } from '@sentry/nextjs';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useWeb3 } from 'hooks/useWeb3';
import networkData from 'config/networkData.json' assert { type: 'json' };

type FloatingPoolInfoProps = {
  symbol: string;
  eMarketAddress?: string;
};

const FloatingPoolInfo: FC<FloatingPoolInfoProps> = ({ symbol, eMarketAddress }) => {
  const { chain } = useWeb3();
  const { accountData } = useContext(AccountDataContext);
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [deposited, setDeposited] = useState<number | undefined>(undefined);
  const [borrowed, setBorrowed] = useState<number | undefined>(undefined);
  const [depositAPR, setDepositAPR] = useState<string | undefined>(undefined);
  const [borrowAPR, setBorrowAPR] = useState<string | undefined>(undefined);

  const fetchPoolData = useCallback(async () => {
    if (!accountData || !symbol) return;

    const {
      totalFloatingDepositAssets: totalDeposited,
      totalFloatingBorrowAssets: totalBorrowed,
      decimals,
      usdPrice: exchangeRate,
    } = accountData[symbol];

    const totalDepositUSD = formatFixed(totalDeposited.mul(exchangeRate).div(WeiPerEther), decimals);

    const totalBorrowUSD = formatFixed(totalBorrowed.mul(exchangeRate).div(WeiPerEther), decimals);

    setDeposited(parseFloat(totalDepositUSD));
    setBorrowed(parseFloat(totalBorrowUSD));
  }, [accountData, symbol]);

  useEffect(() => {
    fetchPoolData().catch(captureException);
  }, [fetchPoolData]);

  const fetchAPRs = useCallback(async () => {
    if (!accountData || !eMarketAddress || !chain) return;
    const subgraphUrl = networkData[String(chain.id) as keyof typeof networkData]?.subgraph;
    if (!subgraphUrl) return;
    const { maxFuturePools } = accountData[symbol];

    // TODO: consider storing these results in a new context so it's only fetched once - already added in tech debt docs
    const [{ apr: depositAPRRate }] = await queryRates(subgraphUrl, eMarketAddress, 'deposit', {
      maxFuturePools,
    });
    const [{ apr: borrowAPRRate }] = await queryRates(subgraphUrl, eMarketAddress, 'borrow');
    setDepositAPR(`${(depositAPRRate * 100).toFixed(2)}%`);

    setBorrowAPR(`${(borrowAPRRate * 100).toFixed(2)}%`);
  }, [accountData, eMarketAddress, symbol, chain]);

  useEffect(() => {
    fetchAPRs().catch(captureException);
  }, [fetchAPRs]);

  const itemsInfo: ItemInfoProps[] = [
    {
      label: translations[lang].totalDeposited,
      value: deposited != null ? `$${formatNumber(deposited)}` : undefined,
    },
    {
      label: translations[lang].totalBorrowed,
      value: borrowed != null ? `$${formatNumber(borrowed)}` : undefined,
    },
    {
      label: translations[lang].TVL,
      value: deposited != null && borrowed != null ? `$${formatNumber(deposited - borrowed)}` : undefined,
    },
    {
      label: translations[lang].depositAPR,
      value: depositAPR,
      tooltipTitle: 'Change in the underlying Variable Rate Pool shares value over the last hour, annualized.',
    },
    {
      label: translations[lang].borrowAPR,
      value: borrowAPR,
      tooltipTitle: 'Change in the underlying Variable Rate Pool shares value over the last hour, annualized.',
    },
    {
      label: translations[lang].utilizationRate,
      value: toPercentage(deposited != null && borrowed != null && deposited > 0 ? borrowed / deposited : undefined),
    },
  ];

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const tempStyle = isMobile
    ? { display: 'flex', justifyContent: 'space-around', width: '100%' }
    : { marginRight: '16px' };

  return (
    <Grid container justifyContent="space-between" gap={2}>
      <Grid>
        <HeaderInfo title={translations[lang].smartPool} itemsInfo={itemsInfo} variant="h5" shadow={false} />
      </Grid>
      <Grid alignSelf="end" sx={tempStyle} p="24px">
        <OrderAction />
      </Grid>
    </Grid>
  );
};

export default FloatingPoolInfo;
