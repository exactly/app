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

type Props = {
  type: 'deposit' | 'borrow';
  rows: FloatingPoolItemData[];
};

function FloatingPoolDashboardTable({ type, rows }: Props) {
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
        label: 'exaToken',
        key: 'exaToken',
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
      <Table>
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
                    width="fit-content"
                  >
                    {header.label}
                  </Typography>
                </Tooltip>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((item: FloatingPoolItemData) => (
            <TableRowFloatingPool
              key={`floating_row_${item.symbol}_${type}`}
              symbol={item.symbol}
              depositAmount={item.depositedAmount}
              borrowedAmount={item.borrowedAmount}
              exaTokenAmount={item.exaTokens}
              type={type}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default React.memo(FloatingPoolDashboardTable);
