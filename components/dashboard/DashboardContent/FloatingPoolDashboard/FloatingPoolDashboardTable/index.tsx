import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';

import AccountDataContext from 'contexts/AccountDataContext';

import { FloatingPoolItemData } from 'types/FloatingPoolItemData';

import { useWeb3Context } from 'contexts/Web3Context';
import TableRowFloatingPool from './TableRowFloatingPool';
import type { HealthFactor } from 'types/HealthFactor';
import type { TableHeader } from 'types/TableHeader';
import type { Previewer } from 'types/contracts/Previewer';

type Props = {
  type: 'deposit' | 'borrow';
  healthFactor?: HealthFactor;
};

function FloatingPoolDashboardTable({ type, healthFactor }: Props) {
  const { walletAddress } = useWeb3Context();
  const { accountData } = useContext(AccountDataContext);

  const [itemData, setItemData] = useState<Array<FloatingPoolItemData> | undefined>();

  const orderAssets = ['DAI', 'USDC', 'WETH', 'WBTC', 'wstETH'];

  useEffect(() => {
    getCurrentBalance();
  }, [walletAddress, accountData, type]);

  function getCurrentBalance() {
    if (!accountData) return;

    const allMarkets = Object.values(accountData).sort(
      (a: Previewer.MarketAccountStructOutput, b: Previewer.MarketAccountStructOutput) => {
        return orderAssets.indexOf(a.assetSymbol) - orderAssets.indexOf(b.assetSymbol);
      },
    );

    const data: FloatingPoolItemData[] = [];

    allMarkets.forEach((market) => {
      const symbol = market.assetSymbol;
      const depositBalance = market.floatingDepositAssets;
      const eTokens = market.floatingDepositShares;
      const borrowBalance = market.floatingBorrowAssets;
      const address = market.market;

      const obj = {
        symbol: symbol,
        eTokens: eTokens,
        depositedAmount: depositBalance,
        borrowedAmount: borrowBalance,
        market: address,
      };

      data.push(obj);
    });

    setItemData(data);
  }

  const headers: TableHeader[] = useMemo(() => {
    return [
      {
        label: 'Asset',
        key: 'asset',
        tooltipPlacement: 'top-start',
        align: 'left',
      },
      {
        label: 'Value',
        key: 'value',
        align: 'center',
      },
      {
        label: 'eToken',
        key: 'eToken',
        hidden: type !== 'deposit',
        tooltipTitle: 'The Exactly voucher token (ERC-4626) for your deposit in the Variable Rate Pool.',
      },
      {
        label: 'Collateral',
        key: 'collateral',
        hidden: type !== 'deposit',
      },
      {
        label: '',
        key: 'deposit',
      },
      {
        label: '',
        key: 'borrow',
      },
    ];
  }, [type]);

  // TODO: remove hardcoded list
  const defaultRows: FloatingPoolItemData[] = [
    { symbol: 'DAI' },
    { symbol: 'USDC' },
    { symbol: 'WETH' },
    { symbol: 'WBTC' },
    { symbol: 'wstETH' },
  ];

  const rows = itemData || defaultRows;

  return (
    <TableContainer component={Paper}>
      <Table aria-label="simple table">
        <TableHead>
          <TableRow>
            {headers.map((header) => (
              <TableCell key={`header_${header.key}_${type}`} align={header.align || 'center'}>
                <Tooltip
                  title={header.hidden ? '' : header.tooltipTitle}
                  placement={header.tooltipPlacement || 'top'}
                  arrow
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ color: 'grey.500', visibility: header.hidden ? 'hidden' : '' }}
                    fontWeight={600}
                  >
                    {header.label}
                  </Typography>
                </Tooltip>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows?.map((item: FloatingPoolItemData) => (
            <TableRowFloatingPool
              key={`floating_row_${item.symbol}_${type}`}
              depositAmount={item.depositedAmount}
              borrowedAmount={item.borrowedAmount}
              symbol={item.symbol}
              walletAddress={walletAddress}
              eTokenAmount={item.eTokens}
              type={type}
              market={item.market}
              healthFactor={healthFactor}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default FloatingPoolDashboardTable;
