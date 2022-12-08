import React, { FC, useCallback, useContext, useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import PoolTable, { TableRow } from './poolTable';

import { formatFixed } from '@ethersproject/bignumber';
import { MaxUint256, WeiPerEther, Zero } from '@ethersproject/constants';

import AccountDataContext from 'contexts/AccountDataContext';
import { useWeb3Context } from 'contexts/Web3Context';

import formatMarkets from 'utils/formatMarkets';
import formatNumber from 'utils/formatNumber';
import getSubgraph from 'utils/getSubgraph';
import queryRate from 'utils/queryRates';

import { Market } from 'types/Market';

import { Typography } from '@mui/material';

import { globals } from 'styles/theme';

const { maxWidth } = globals;

const defaultRows: TableRow[] = [
  { symbol: 'DAI' },
  { symbol: 'USDC' },
  { symbol: 'WETH' },
  { symbol: 'WBTC' },
  { symbol: 'wstETH' },
];

// sorts rows based on defaultRows symbol order
const sortByDefault = (toSort: TableRow[]) =>
  toSort.sort(({ symbol: aSymbol }, { symbol: bSymbol }) => {
    const aIndex = defaultRows.findIndex(({ symbol }) => symbol === aSymbol);
    const bIndex = defaultRows.findIndex(({ symbol }) => symbol === bSymbol);
    return aIndex - bIndex;
  });

const MarketTables: FC = () => {
  const { network } = useWeb3Context();
  const { accountData } = useContext(AccountDataContext);

  const [floatingRows, setFloatingRows] = useState<TableRow[]>([...defaultRows]);
  const [fixedRows, setFixedRows] = useState<TableRow[]>([...defaultRows]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getMarkets = useCallback(async () => {
    if (!accountData) return;

    setMarkets(formatMarkets(accountData));
  }, [accountData]);

  const defineRows = useCallback(async () => {
    if (!accountData || !markets) return;

    const networkName = network ? network.name : 'mainnet'; // HACK if we dont have network we set a default to show data without a connected address

    const tempFloatingRows: TableRow[] = [];
    const tempFixedRows: TableRow[] = [];

    await Promise.all(
      markets.map(async ({ symbol }) => {
        const {
          market: marketAddress,
          totalFloatingDepositAssets,
          totalFloatingBorrowAssets,
          usdPrice,
          decimals,
          maxFuturePools,
        } = accountData[symbol];

        const totalFloatingDeposited = formatNumber(
          formatFixed(totalFloatingDepositAssets.mul(usdPrice).div(WeiPerEther), decimals),
        );
        const totalFloatingBorrowed = formatNumber(
          formatFixed(totalFloatingBorrowAssets.mul(usdPrice).div(WeiPerEther), decimals),
        );

        const floatingDepositAPR = await getRates(networkName, 'deposit', maxFuturePools, marketAddress);
        const floatingBorrowAPR = await getRates(networkName, 'borrow', maxFuturePools, marketAddress);

        tempFloatingRows.push({
          symbol,
          totalDeposited: totalFloatingDeposited,
          totalBorrowed: totalFloatingBorrowed,
          depositAPR: floatingDepositAPR,
          borrowAPR: floatingBorrowAPR,
        });

        let totalDeposited = Zero;
        let totalBorrowed = Zero;

        // Set deposits and borrows total of fixed pools
        const { fixedPools } = accountData[symbol];
        fixedPools.forEach(({ supplied, borrowed }) => {
          totalDeposited = totalDeposited.add(supplied);
          totalBorrowed = totalBorrowed.add(borrowed);
        });

        const bestBorrow = fixedPools.reduce(
          (best, { maturity, minBorrowRate: rate }) => (rate.lt(best.rate) ? { maturity, rate } : best),
          { maturity: Zero, rate: MaxUint256 },
        );
        const bestDeposit = fixedPools.reduce(
          (best, { maturity, depositRate: rate }) => (rate.gt(best.rate) ? { maturity, rate } : best),
          { maturity: Zero, rate: Zero },
        );

        tempFixedRows.push({
          symbol,
          totalDeposited: formatNumber(formatFixed(totalDeposited.mul(usdPrice).div(WeiPerEther), decimals)),
          totalBorrowed: formatNumber(formatFixed(totalBorrowed.mul(usdPrice).div(WeiPerEther), decimals)),
          borrowAPR: Number(bestBorrow.rate) / 1e18,
          depositAPR: Number(bestDeposit.rate) / 1e18,
          borrowMaturity: Number(bestBorrow.maturity),
          depositMaturity: Number(bestDeposit.maturity),
        });
      }),
    );

    setFloatingRows(sortByDefault(tempFloatingRows));
    setFixedRows(sortByDefault(tempFixedRows));

    setTimeout(() => {
      // HACK to prevent loading flashes on the table when change the data
      setIsLoading(false);
    }, 2000);
  }, [accountData, network, markets]);

  const floatingHeaders = [
    {
      title: 'Asset',
      width: '130px',
    },
    {
      title: 'Total Deposits',
    },
    {
      title: 'Total Borrows',
    },
    {
      title: 'Deposit APR',
      tooltipTitle: 'Change in the underlying Variable Rate Pool shares value over the last hour, annualized.',
    },
    {
      title: 'Borrow APR',
      tooltipTitle: 'Change in the underlying Variable Rate Pool shares value over the last hour, annualized.',
    },
  ];
  const fixedHeaders = [
    {
      title: 'Asset',
      width: '130px',
    },
    {
      title: 'Total Deposits',
      tooltipTitle: 'Sum of all the deposits in all the Fixed Rate Pools.',
    },
    {
      title: 'Total Borrows',
      tooltipTitle: 'Sum of all the borrows in all the Fixed Rate Pools.',
    },
    {
      title: 'Best Deposit APR',
      tooltipTitle: 'The highest fixed interest rate APR for a $1 deposit in all the available Fixed Rated Pools.',
    },
    {
      title: 'Best Borrow APR',
      tooltipTitle: 'The lowest fixed interest rate APR for a $1 borrow in all the available Fixed Rated Pools.',
    },
  ];

  async function getRates(
    networkName: string,
    type: 'borrow' | 'deposit',
    maxFuturePools: number,
    eMarketAddress: string,
  ) {
    const subgraphUrl = getSubgraph(networkName);
    if (!subgraphUrl) return;

    const [{ apr }] = await queryRate(subgraphUrl, eMarketAddress, type, { maxFuturePools });
    return apr;
  }

  useEffect(() => {
    void defineRows();
  }, [defineRows]);

  useEffect(() => {
    void getMarkets();
  }, [accountData, getMarkets]);

  return (
    <Grid container sx={{ maxWidth: maxWidth, margin: 'auto' }}>
      <Grid width={'100%'} my={4} padding={2} sx={{ boxShadow: '#A7A7A7 0px 0px 4px 0px', borderRadius: '5px' }}>
        <Typography variant="h5">Variable Interest Rate</Typography>
        <PoolTable isLoading={isLoading} headers={floatingHeaders} rows={floatingRows} rateType={'floating'} />
      </Grid>
      <Grid width={'100%'} mb={20} padding={2} sx={{ boxShadow: '#A7A7A7 0px 0px 4px 0px', borderRadius: '5px' }}>
        <Typography variant="h5">Fixed Interest Rate</Typography>
        <PoolTable isLoading={isLoading} headers={fixedHeaders} rows={fixedRows} rateType={'fixed'} />
      </Grid>
    </Grid>
  );
};

export default MarketTables;
