import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import Grid from '@mui/material/Grid';
import PoolTable, { TableRow } from './poolTable';
import { useTranslation } from 'react-i18next';
import { formatUnits } from 'viem';

import formatNumber from 'utils/formatNumber';
import getFloatingDepositAPR from 'utils/getFloatingDepositAPR';

import { Box, Typography } from '@mui/material';

import { globals } from 'styles/theme';
import { useWeb3 } from 'hooks/useWeb3';
import useAssets from 'hooks/useAssets';
import PoolMobile from './poolMobile';
import MobileTabs from 'components/MobileTabs';
import { TableHeader } from 'components/common/TableHeadCell';
import useAccountData from 'hooks/useAccountData';
import { useGlobalError } from 'contexts/GlobalErrorContext';
import usePreviousValue from 'hooks/usePreviousValue';
import useAnalytics from 'hooks/useAnalytics';
import { MAX_UINT256, WEI_PER_ETHER } from 'utils/const';

const { onlyMobile, onlyDesktop } = globals;

// sorts rows based on defaultRows symbol order
const sortByDefault = (defaultRows: TableRow[], toSort: TableRow[]) =>
  toSort.sort(({ symbol: aSymbol }, { symbol: bSymbol }) => {
    const aIndex = defaultRows.findIndex(({ symbol }) => symbol === aSymbol);
    const bIndex = defaultRows.findIndex(({ symbol }) => symbol === bSymbol);
    return aIndex - bIndex;
  });

const MarketTables: FC = () => {
  const { t } = useTranslation();
  const { chain } = useWeb3();
  const { accountData } = useAccountData();
  const assets = useAssets();
  const defaultRows = useMemo<TableRow[]>(() => assets.map((s) => ({ symbol: s })), [assets]);

  const [floatingRows, setFloatingRows] = useState<TableRow[]>([...defaultRows]);
  const [fixedRows, setFixedRows] = useState<TableRow[]>([...defaultRows]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setIndexerError } = useGlobalError();

  const {
    list: { viewItemListAdvance },
  } = useAnalytics();

  const floatingHeaders: TableHeader<TableRow>[] = [
    {
      title: t('Asset'),
      width: '130px',
      sortKey: 'symbol',
    },
    {
      title: t('Total Deposits'),
      sortKey: 'totalDeposited',
    },
    {
      title: t('Total Borrows'),
      sortKey: 'totalBorrowed',
    },
    {
      title: t('Deposit APR'),
      tooltipTitle: t('Change in the underlying Variable Rate Pool shares value over the last 15 minutes, annualized.'),
      sortKey: 'depositAPR',
    },
    {
      title: t('Borrow APR'),
      tooltipTitle: t('The borrowing interest APR related to the current utilization rate in the Variable Rate Pool.'),
      sortKey: 'borrowAPR',
    },
  ];

  const fixedHeaders: TableHeader<TableRow>[] = [
    {
      title: t('Asset'),
      width: '130px',
      sortKey: 'symbol',
    },
    {
      title: t('Total Deposits'),
      tooltipTitle: t('Sum of all the deposits in all the Fixed Rate Pools.'),
      sortKey: 'totalDeposited',
    },
    {
      title: t('Total Borrows'),
      tooltipTitle: t('Sum of all the borrows in all the Fixed Rate Pools.'),
      sortKey: 'totalBorrowed',
    },
    {
      title: t('Best Deposit APR'),
      tooltipTitle: t('The highest fixed interest APR for a deposit up to the optimal deposit size.'),
      sortKey: 'depositAPR',
    },
    {
      title: t('Best Borrow APR'),
      tooltipTitle: t(
        'The lowest fixed borrowing interest APR at current utilization levels for all the Fixed Rate Pools.',
      ),
      sortKey: 'borrowAPR',
    },
  ];

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
            formatUnits((totalFloatingDepositAssets * usdPrice) / WEI_PER_ETHER, decimals),
          );
          const totalFloatingBorrowed = formatNumber(
            formatUnits((totalFloatingBorrowAssets * usdPrice) / WEI_PER_ETHER, decimals),
          );

          const floatingDepositAPR = await getFloatingDepositAPR(
            chain.id,
            'deposit',
            maxFuturePools,
            marketAddress,
          ).catch(() => {
            setIndexerError();
            return undefined;
          });

          tempFloatingRows.push({
            symbol,
            totalDeposited: totalFloatingDeposited,
            totalBorrowed: totalFloatingBorrowed,
            depositAPR: floatingDepositAPR,
            borrowAPR: Number(floatingBorrowRate) / 1e18,
          });

          let totalDeposited = 0n;
          let totalBorrowed = 0n;

          // Set deposits and borrows total of fixed pools
          fixedPools.forEach(({ supplied, borrowed }) => {
            totalDeposited += supplied;
            totalBorrowed += borrowed;
          });

          const bestBorrow = fixedPools.reduce(
            (best, { maturity, minBorrowRate: rate }) => (rate < best.rate ? { maturity, rate } : best),
            { maturity: 0n, rate: MAX_UINT256 },
          );
          const bestDeposit = fixedPools.reduce(
            (best, { maturity, depositRate: rate }) => (rate > best.rate ? { maturity, rate } : best),
            { maturity: 0n, rate: 0n },
          );

          tempFixedRows.push({
            symbol,
            totalDeposited: formatNumber(formatUnits((totalDeposited * usdPrice) / WEI_PER_ETHER, decimals)),
            totalBorrowed: formatNumber(formatUnits((totalBorrowed * usdPrice) / WEI_PER_ETHER, decimals)),
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
  }, [accountData, chain, defaultRows, setIndexerError]);

  useEffect(() => {
    void defineRows();
  }, [defineRows]);

  const previousFloatingRows = usePreviousValue(floatingRows);
  const previousFixedRows = usePreviousValue(fixedRows);

  useEffect(() => {
    if (previousFloatingRows !== floatingRows && !isLoading) {
      viewItemListAdvance(floatingRows, 'floating');
    }

    if (previousFixedRows !== fixedRows && !isLoading) {
      viewItemListAdvance(fixedRows, 'fixed');
    }
  }, [floatingRows, fixedRows, previousFloatingRows, previousFixedRows, viewItemListAdvance, isLoading]);

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
          {t('Variable Interest Rate')}
        </Typography>
        <PoolTable isLoading={isLoading} headers={floatingHeaders} rows={floatingRows} rateType="floating" />
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
          {t('Fixed Interest Rate')}
        </Typography>
        <PoolTable isLoading={isLoading} headers={fixedHeaders} rows={fixedRows} rateType="fixed" />
      </Grid>
      <Box display={onlyMobile} my={2}>
        <MobileTabs
          tabs={[
            {
              title: t('Variable Interest Rate'),
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
              title: t('Fixed Interest Rate'),
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
