import React, { useMemo } from 'react';
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

import { FloatingPoolItemData } from 'types/FloatingPoolItemData';

import TableRowFloatingPool from './TableRowFloatingPool';
import type { TableHeader } from 'types/TableHeader';
import useDashboard from 'hooks/useDashboard';

type Props = {
  type: 'deposit' | 'borrow';
};

function FloatingPoolDashboardTable({ type }: Props) {
  const { floatingRows } = useDashboard(type);

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
          {floatingRows.map((item: FloatingPoolItemData) => (
            <TableRowFloatingPool
              key={`floating_row_${item.symbol}_${type}`}
              symbol={item.symbol}
              depositAmount={item.depositedAmount}
              borrowedAmount={item.borrowedAmount}
              eTokenAmount={item.eTokens}
              type={type}
              market={item.market}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default FloatingPoolDashboardTable;
