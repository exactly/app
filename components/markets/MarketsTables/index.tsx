import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import Grid from '@mui/material/Grid';
import PoolTable, { TableRow } from './poolTable';

import { formatFixed } from '@ethersproject/bignumber';
import { MaxUint256, WeiPerEther, Zero } from '@ethersproject/constants';

import formatNumber from 'utils/formatNumber';
import queryRate from 'utils/queryRates';

import { Box, Typography } from '@mui/material';

import { globals } from 'styles/theme';
import { useWeb3 } from 'hooks/useWeb3';
import networkData from 'config/networkData.json' assert { type: 'json' };
import useAssets from 'hooks/useAssets';
import PoolMobile from './poolMobile';
import MobileTabs from 'components/MobileTabs';
import { TableHeader } from 'components/common/TableHeadCell';
import useAccountData from 'hooks/useAccountData';

const { onlyMobile, onlyDesktop } = globals;

const floatingHeaders: TableHeader<TableRow>[] = [
  {
    title: 'Asset',
    width: '130px',
    sortKey: 'symbol',
  },
  {
    title: 'Total Deposits',
    sortKey: 'totalDeposited',
  },
  {
    title: 'Total Borrows',
    sortKey: 'totalBorrowed',
  },
  {
    title: 'Deposit APR',
    tooltipTitle: 'Change in the underlying Variable Rate Pool shares value over the last 15 minutes, annualized.',
    sortKey: 'depositAPR',
  },
  {
    title: 'Borrow APR',
    tooltipTitle: 'The borrowing interest APR related to the current utilization rate in the Variable Rate Pool.',
    sortKey: 'borrowAPR',
  },
];

const fixedHeaders: TableHeader<TableRow>[] = [
  {
    title: 'Asset',
    width: '130px',
    sortKey: 'symbol',
  },
  {
    title: 'Total Deposits',
    tooltipTitle: 'Sum of all the deposits in all the Fixed Rate Pools.',
    sortKey: 'totalDeposited',
  },
  {
    title: 'Total Borrows',
    tooltipTitle: 'Sum of all the borrows in all the Fixed Rate Pools.',
    sortKey: 'totalBorrowed',
  },
  {
    title: 'Best Deposit APR',
    tooltipTitle: 'The highest fixed interest APR for a deposit up to the optimal deposit size.',
    sortKey: 'depositAPR',
  },
  {
    title: 'Best Borrow APR',
    tooltipTitle: 'The lowest fixed borrowing interest APR at current utilization levels for all the Fixed Rate Pools.',
    sortKey: 'borrowAPR',
  },
];

// sorts rows based on defaultRows symbol order
const sortByDefault = (defaultRows: TableRow[], toSort: TableRow[]) =>
  toSort.sort(({ symbol: aSymbol }, { symbol: bSymbol }) => {
    const aIndex = defaultRows.findIndex(({ symbol }) => symbol === aSymbol);
    const bIndex = defaultRows.findIndex(({ symbol }) => symbol === bSymbol);
    return aIndex - bIndex;
  });

const MarketTables: FC = () => {
  const { chain } = useWeb3();
  const { accountData } = useAccountData();
  const assets = useAssets();
  const defaultRows = useMemo<TableRow[]>(() => assets.map((s) => ({ symbol: s })), [assets]);

  const [floatingRows, setFloatingRows] = useState<TableRow[]>([...defaultRows]);
  const [fixedRows, setFixedRows] = useState<TableRow[]>([...defaultRows]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getRates = useCallback(
    async (chainId: number, type: 'borrow' | 'deposit', maxFuturePools: number, eMarketAddress: string) => {
      const subgraphUrl = networkData[String(chainId) as keyof typeof networkData]?.subgraph;
      if (!subgraphUrl) return;

      const [{ apr }] = await queryRate(subgraphUrl, eMarketAddress, type, { maxFuturePools });
      return apr;
    },
    [],
  );

  const defineRows = useCallback(async () => {
    setIsLoading(true);

    if (!accountData || !chain) return;

    const tempFloatingRows: TableRow[] = [];
    const tempFixedRows: TableRow[] = [];

    await Promise.all(
      accountData.map(
        async ({
          assetSymbol: symbol,
          market: marketAddress,
          totalFloatingDepositAssets,
          totalFloatingBorrowAssets,
          usdPrice,
          decimals,
          maxFuturePools,
          floatingBorrowRate,
          fixedPools,
        }) => {
          const totalFloatingDeposited = formatNumber(
            formatFixed(totalFloatingDepositAssets.mul(usdPrice).div(WeiPerEther), decimals),
          );
          const totalFloatingBorrowed = formatNumber(
            formatFixed(totalFloatingBorrowAssets.mul(usdPrice).div(WeiPerEther), decimals),
          );

          const floatingDepositAPR = await getRates(chain.id, 'deposit', maxFuturePools, marketAddress);

          tempFloatingRows.push({
            symbol,
            totalDeposited: totalFloatingDeposited,
            totalBorrowed: totalFloatingBorrowed,
            depositAPR: floatingDepositAPR,
            borrowAPR: Number(floatingBorrowRate) / 1e18,
          });

          let totalDeposited = Zero;
          let totalBorrowed = Zero;

          // Set deposits and borrows total of fixed pools
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
        },
      ),
    );

    setFloatingRows(sortByDefault(defaultRows, tempFloatingRows));
    setFixedRows(sortByDefault(defaultRows, tempFixedRows));

    setIsLoading(false);
  }, [accountData, chain, defaultRows, getRates]);

  useEffect(() => {
    void defineRows();
  }, [defineRows]);

  return (
    <>
      <Grid
        my="16px"
        p="24px"
        boxShadow="0px 4px 12px rgba(175, 177, 182, 0.2)"
        borderRadius="0px 0px 6px 6px"
        bgcolor="components.bg"
        borderTop="4px solid #34C53A"
        display={onlyDesktop}
      >
        <Typography variant="h6" pb="16px">
          Variable Interest Rate
        </Typography>
        <PoolTable isLoading={isLoading} headers={floatingHeaders} rows={floatingRows} rateType={'floating'} />
      </Grid>
      <Grid
        width={'100%'}
        mb="16px"
        p="24px"
        boxShadow="0px 4px 12px rgba(175, 177, 182, 0.2)"
        borderRadius="0px 0px 6px 6px"
        bgcolor="components.bg"
        borderTop="4px solid #008CF4"
        display={onlyDesktop}
      >
        <Typography variant="h6" pb="16px">
          Fixed Interest Rate
        </Typography>
        <PoolTable isLoading={isLoading} headers={fixedHeaders} rows={fixedRows} rateType="fixed" />
      </Grid>
      <Box display={onlyMobile} my={2}>
        <MobileTabs
          tabs={[
            {
              title: 'Variable Interest Rate',
              content: (
                <PoolMobile
                  key={`markets_pool_mobile_floating`}
                  isLoading={isLoading}
                  headers={floatingHeaders}
                  rows={floatingRows}
                  rateType="floating"
                />
              ),
            },
            {
              title: 'Fixed Interest Rate',
              content: (
                <PoolMobile
                  key={`markets_pool_mobile_fixed`}
                  isLoading={isLoading}
                  headers={fixedHeaders}
                  rows={fixedRows}
                  rateType="fixed"
                />
              ),
            },
          ]}
        />
      </Box>
    </>
  );
};

export default MarketTables;
