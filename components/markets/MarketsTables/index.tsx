import React, { FC, useCallback, useContext, useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import PoolTable, { TableRow } from './poolTable';

import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import { WeiPerEther, Zero } from '@ethersproject/constants';

import AccountDataContext from 'contexts/AccountDataContext';
import { useWeb3Context } from 'contexts/Web3Context';
import PreviewerContext from 'contexts/PreviewerContext';
import ContractsContext from 'contexts/ContractsContext';

import formatMarkets from 'utils/formatMarkets';
import formatNumber from 'utils/formatNumber';
import getSubgraph from 'utils/getSubgraph';
import queryRate from 'utils/queryRates';
import getAPRsPerMaturity from 'utils/getAPRsPerMaturity';

import { Market } from 'types/Market';
import { FixedMarketData } from 'types/FixedMarketData';

import numbers from 'config/numbers.json';
import { Typography } from '@mui/material';

const { usdAmount: usdAmountPreviewer } = numbers;

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
  const previewerData = useContext(PreviewerContext);
  const { getInstance } = useContext(ContractsContext);

  const [floatingRows, setFloatingRows] = useState<TableRow[]>([...defaultRows]);
  const [fixedRows, setFixedRows] = useState<TableRow[]>([...defaultRows]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getMarkets = useCallback(async () => {
    if (!accountData) return;

    setMarkets(formatMarkets(accountData));
  }, [accountData]);

  const defineRows = useCallback(async () => {
    if (!accountData || !markets || !previewerData.address || !previewerData.abi) return;

    const networkName = network ? network.name : 'goerli'; // HACK if we dont have network we set a default to show data without a connected address

    const previewerContract = getInstance(previewerData.address, previewerData.abi, 'previewer');

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
        accountData[symbol].fixedPools.forEach((m) => {
          totalDeposited = totalDeposited.add(m.supplied);
          totalBorrowed = totalBorrowed.add(m.borrowed);
        });

        const previewFixedData: FixedMarketData[] = await previewerContract?.previewFixed(
          parseFixed(usdAmountPreviewer.toString(), 18),
        );

        const marketMaturities = previewFixedData.find(({ market }) => market === marketAddress) as FixedMarketData;

        const { deposits, borrows, assets: initialAssets } = marketMaturities;

        const { APRsPerMaturity, maturityMaxAPRDeposit, maturityMinAPRBorrow } = getAPRsPerMaturity(
          deposits,
          borrows,
          decimals,
          initialAssets,
        );

        const depositAPR = {
          timestamp: maturityMaxAPRDeposit ?? undefined,
          apr: APRsPerMaturity[maturityMaxAPRDeposit]?.deposit,
        };

        const borrowAPR = {
          timestamp: maturityMinAPRBorrow ?? undefined,
          apr: APRsPerMaturity[maturityMinAPRBorrow]?.borrow,
        };

        tempFixedRows.push({
          symbol,
          totalDeposited: formatNumber(formatFixed(totalDeposited.mul(usdPrice).div(WeiPerEther), decimals)),
          totalBorrowed: formatNumber(formatFixed(totalBorrowed.mul(usdPrice).div(WeiPerEther), decimals)),
          depositAPR: depositAPR.apr,
          borrowAPR: borrowAPR.apr,
          borrowTimestamp: borrowAPR.timestamp,
          depositTimestamp: depositAPR.timestamp,
        });
      }),
    );

    setFloatingRows(sortByDefault(tempFloatingRows));
    setFixedRows(sortByDefault(tempFixedRows));

    setTimeout(() => {
      // HACK to prevent loading flashes on the table when change the data
      setIsLoading(false);
    }, 2000);
  }, [accountData, network, markets, previewerData.abi, previewerData.address]);

  const floatingHeaders = [
    {
      title: 'Asset',
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

    const data = await queryRate(subgraphUrl, eMarketAddress, type, { maxFuturePools });

    const interestRate = data[0].apr;

    return interestRate;
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
        <Typography variant="h5">Variable Rate Pools</Typography>
        <PoolTable isLoading={isLoading} headers={floatingHeaders} rows={floatingRows} rateType={'floating'} />
      </Grid>
      <Grid width={'100%'} mb={20} padding={2} sx={{ boxShadow: '#A7A7A7 0px 0px 4px 0px', borderRadius: '5px' }}>
        <Typography variant="h5">Fixed Rate Pools</Typography>
        <PoolTable isLoading={isLoading} headers={fixedHeaders} rows={fixedRows} rateType={'fixed'} />
      </Grid>
    </Grid>
  );
};

export default MarketTables;
