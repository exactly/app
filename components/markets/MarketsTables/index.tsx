import React, { FC, useMemo } from 'react';
import Grid from '@mui/material/Grid';
import PoolTable, { TableRow } from './poolTable';
import { useTranslation } from 'react-i18next';
import { formatEther, formatUnits } from 'viem';
import { MAX_UINT256, WAD } from '@exactly/lib';

import formatNumber from 'utils/formatNumber';

import { Box } from '@mui/material';

import { globals } from 'styles/theme';
import useAssets from 'hooks/useAssets';
import PoolMobile from './poolMobile';
import { TableHeader } from 'components/common/TableHeadCell';
import usePreviewerExactly from 'hooks/usePreviewerExactly';
import useRewards from 'hooks/useRewards';
import { WEEK } from 'utils/utils';
import useFloatingDepositRates from 'hooks/useFloatingDepositRates';

const { smOrLess, mdOrMore } = globals;

// sorts rows based on defaultRows symbol order
const sortByDefault = (defaultRows: TableRow[], toSort: TableRow[]) =>
  toSort.sort(({ symbol: aSymbol }, { symbol: bSymbol }) => {
    const aIndex = defaultRows.findIndex(({ symbol }) => symbol === aSymbol);
    const bIndex = defaultRows.findIndex(({ symbol }) => symbol === bSymbol);
    return aIndex - bIndex;
  });

const MarketTables: FC = () => {
  const { t } = useTranslation();
  const { data: accountData } = usePreviewerExactly();
  const { data: floatingDepositAPRs } = useFloatingDepositRates();
  const { rates } = useRewards();
  const assets = useAssets();
  const defaultRows = useMemo<TableRow[]>(() => assets.map((s) => ({ symbol: s })), [assets]);

  const floatingHeaders: TableHeader<TableRow>[] = [
    {
      key: 'Asset',
      title: t('Asset'),
      width: '130px',
      sortKey: 'symbol',
      sx: { pl: 3, pr: 3, pt: 1, pb: 1 },
    },
    {
      key: 'Total Deposits',
      title: t('Total Deposits'),
      sortKey: 'totalDeposited',
      sx: { pl: 3, pr: 1.5, pt: 1, pb: 1 },
    },
    {
      key: 'Best Deposit APR',
      title: t('Best Deposit APR'),
      tooltipTitle: t('Projected from the current Variable Rate Pool onchain snapshot, annualized.'),
      sortKey: 'depositAPR',
      sx: { pl: 1.5, pr: 1.5, pt: 1, pb: 1 },
    },
    {
      key: 'depositColumn',
      title: '',
      width: '130px',
      sx: { pl: 1.5, pr: 3, pt: 1, pb: 1 },
    },
    {
      key: 'Total Borrows',
      title: t('Total Borrows'),
      sortKey: 'totalBorrowed',
      sx: { pl: 3, pr: 1.5, pt: 1, pb: 1 },
    },
    {
      key: 'Best Borrow APR',
      title: t('Best Borrow APR'),
      tooltipTitle: t('The borrowing interest APR related to the current utilization rate in the Variable Rate Pool.'),
      sortKey: 'borrowAPR',
      sx: { pl: 1.5, pr: 1.5, pt: 1, pb: 1 },
    },
    {
      key: 'borrowColumn',
      title: '',
      width: '130px',
      sx: { pl: 1.5, pr: 3, pt: 1, pb: 1 },
    },
  ];

  const fixedHeaders: TableHeader<TableRow>[] = [
    {
      key: 'Asset',
      title: t('Asset'),
      width: '130px',
      sortKey: 'symbol',
    },
    {
      key: 'Total Deposits',
      title: t('Total Deposits'),
      tooltipTitle: t('Sum of all the deposits in all the Fixed Rate Pools.'),
      sortKey: 'totalDeposited',
    },
    {
      key: 'Total Borrows',
      title: t('Total Borrows'),
      tooltipTitle: t('Sum of all the borrows in all the Fixed Rate Pools.'),
      sortKey: 'totalBorrowed',
    },
    {
      key: 'Best Deposit APR',
      title: t('Best Deposit APR'),
      tooltipTitle: t('The highest fixed interest APR for a deposit up to the optimal deposit size.'),
      sortKey: 'depositAPR',
    },
    {
      key: 'Best Borrow APR',
      title: t('Best Borrow APR'),
      tooltipTitle: t(
        'The lowest fixed borrowing interest APR at current utilization levels for all the Fixed Rate Pools.',
      ),
      sortKey: 'borrowAPR',
    },
  ];

  const rows = useMemo(() => {
    if (!accountData) return [...defaultRows];
    const tempRows: TableRow[] = [];

    accountData.forEach(
      ({
        assetSymbol: symbol,
        market: marketAddress,
        totalFloatingDepositAssets,
        totalFloatingBorrowAssets,
        usdPrice,
        decimals,
        floatingBorrowRate,
        fixedPools,
      }) => {
        let totalDeposited = 0n;
        let totalBorrowed = 0n;

        totalDeposited += totalFloatingDepositAssets;
        totalBorrowed += totalFloatingBorrowAssets;

        fixedPools.forEach(({ supplied, borrowed }) => {
          totalDeposited += supplied;
          totalBorrowed += borrowed;
        });

        const floatingDepositAPR = floatingDepositAPRs?.[marketAddress.toLowerCase()];

        const depositRewards =
          rates[symbol]?.map(({ floatingDeposit }) => floatingDeposit).reduce((sum, reward) => sum + reward, 0n) || 0n;

        const bestFixedDeposit = fixedPools.reduce(
          (best, { maturity, depositRate }) =>
            Number(formatEther(depositRate)) > best.rate
              ? { maturity: maturity, rate: Number(formatEther(depositRate)) }
              : best,
          { maturity: 0n, rate: 0 },
        );

        const bestFixedBorrow = fixedPools.reduce(
          (best, { maturity, minBorrowRate }) =>
            (Number(formatEther(minBorrowRate)) === best.rate && maturity > best.maturity) ||
            Number(formatEther(minBorrowRate)) < best.rate
              ? { maturity: maturity, rate: Number(formatEther(minBorrowRate)) }
              : best,
          { maturity: 0n, rate: Number(formatEther(MAX_UINT256)) },
        );

        const bestDeposit =
          floatingDepositAPR === undefined
            ? { maturity: bestFixedDeposit.maturity, rate: Number(bestFixedDeposit.rate) }
            : bestFixedDeposit.rate > floatingDepositAPR + Number(depositRewards)
              ? { maturity: bestFixedDeposit.maturity, rate: bestFixedDeposit.rate }
              : { maturity: 0n, rate: floatingDepositAPR };

        const bestBorrow =
          bestFixedBorrow.rate < Number(formatEther(floatingBorrowRate))
            ? { maturity: bestFixedBorrow.maturity, rate: bestFixedBorrow.rate }
            : { maturity: 0n, rate: Number(formatEther(floatingBorrowRate)) };
        const [first, second] = [...fixedPools].sort((a, b) => Number(a.maturity) - Number(b.maturity));
        const now = BigInt(Math.round(Date.now() / 1000));
        const upcomingMaturity = first.maturity - now < WEEK ? second.maturity : first.maturity;

        tempRows.push({
          symbol,
          totalDeposited: formatNumber(formatUnits((totalDeposited * usdPrice) / WAD, decimals)),
          totalBorrowed: formatNumber(formatUnits((totalBorrowed * usdPrice) / WAD, decimals)),
          depositAPR: bestDeposit.rate,
          depositMaturity: bestDeposit.maturity,
          borrowAPR: bestBorrow.rate,
          borrowMaturity: bestBorrow.maturity,
          upcomingMaturity,
          depositedAssets: formatNumber(formatUnits(totalDeposited, decimals), symbol),
          borrowedAssets: formatNumber(formatUnits(totalBorrowed, decimals), symbol),
        });
      },
    );

    return sortByDefault(
      defaultRows,
      tempRows.filter((row) => row.symbol !== 'USDC.e'),
    );
  }, [accountData, defaultRows, floatingDepositAPRs, rates]);

  const isLoading = !accountData;

  return (
    <>
      <Grid
        my={2}
        boxShadow={({ palette }) => (palette.mode === 'light' ? '0px 4px 12px rgba(175, 177, 182, 0.2)' : '')}
        borderRadius="8px 8px 0px 0px"
        bgcolor="components.bg"
        display={mdOrMore}
      >
        <PoolTable isLoading={isLoading} headers={floatingHeaders} rows={rows} />
      </Grid>

      <Box display={smOrLess} my={2}>
        <PoolMobile key={`markets_pool_mobile_fixed`} isLoading={isLoading} headers={fixedHeaders} rows={rows} />
      </Box>
    </>
  );
};

export default MarketTables;
