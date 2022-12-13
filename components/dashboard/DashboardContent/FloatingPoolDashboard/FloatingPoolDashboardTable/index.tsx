import React, { useContext, useMemo } from 'react';
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
import { useWeb3 } from 'hooks/useWeb3';

import TableRowFloatingPool from './TableRowFloatingPool';
import type { HealthFactor } from 'types/HealthFactor';
import type { TableHeader } from 'types/TableHeader';
import type { Previewer } from 'types/contracts/Previewer';
import useAssets from 'hooks/useAssets';

type Props = {
  type: 'deposit' | 'borrow';
  healthFactor?: HealthFactor;
};

function FloatingPoolDashboardTable({ type, healthFactor }: Props) {
  const { walletAddress } = useWeb3();
  const { accountData } = useContext(AccountDataContext);

  const orderAssets = useAssets();

  const defaultRows: FloatingPoolItemData[] = useMemo<FloatingPoolItemData[]>(
    () => orderAssets.map((s) => ({ symbol: s })),
    [orderAssets],
  );

  const itemData = useMemo<FloatingPoolItemData[] | undefined>(() => {
    if (!accountData) return;

    const allMarkets = Object.values(accountData).sort(
      (a: Previewer.MarketAccountStructOutput, b: Previewer.MarketAccountStructOutput) => {
        return orderAssets.indexOf(a.assetSymbol) - orderAssets.indexOf(b.assetSymbol);
      },
    );

    return allMarkets.map((market) => {
      const symbol = market.assetSymbol;
      const depositBalance = market.floatingDepositAssets;
      const eTokens = market.floatingDepositShares;
      const borrowBalance = market.floatingBorrowAssets;
      const address = market.market;

      return {
        symbol: symbol,
        eTokens: eTokens,
        depositedAmount: depositBalance,
        borrowedAmount: borrowBalance,
        market: address,
      };
    });
  }, [accountData, orderAssets]);

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
        align: 'left',
      },
      {
        label: 'eToken',
        key: 'eToken',
        hidden: type !== 'deposit',
        tooltipTitle: 'The Exactly voucher token (ERC-4626) for your deposit in the Variable Rate Pool.',
        align: 'left',
      },
      {
        label: 'Collateral',
        key: 'collateral',
        hidden: type !== 'deposit',
        align: 'left',
      },
      {
        label: '',
        key: 'deposit',
        align: 'left',
      },
      {
        label: '',
        key: 'borrow',
        align: 'left',
      },
    ];
  }, [type]);

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
