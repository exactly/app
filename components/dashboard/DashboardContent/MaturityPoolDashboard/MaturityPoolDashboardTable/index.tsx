import React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TableRowMaturityPool from './TableRowMaturityPool';
import { Tooltip } from '@mui/material';

type Props = {
  type: 'deposit' | 'borrow';
  maturities: any;
};

const headers: {
  label: string;
  key: string;
  tooltipTitle?: string;
  tooltipPlacement?: 'top' | 'top-start' | 'top-end';
  align?: 'left' | 'inherit' | 'center' | 'right' | 'justify';
  hidden?: boolean;
}[] = [
  {
    label: 'Asset',
    key: 'asset',
    tooltipPlacement: 'top-start',
    align: 'left',
  },
  {
    label: 'Deposited Amount',
    key: 'deposited amount',
  },
  {
    label: 'Average Fixed Rate',
    key: 'average fixed rate',
  },
  {
    label: 'Maturity Date',
    key: 'maturity date',
  },
  {
    label: 'Time Elapsed',
    key: 'time elapsed',
  },
  {
    label: '',
    key: 'action',
  },
  {
    label: '',
    key: 'expandable button',
    hidden: true,
  },
];

function MaturityPoolDashboardTable({ type, maturities }: Props) {
  return (
    <TableContainer component={Paper}>
      <Table aria-label="collapsible table">
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
          {maturities &&
            Object?.keys(maturities)
              ?.flatMap((maturity) => maturities[maturity])
              ?.map(({ principal, maturity, symbol, market, decimals }) => (
                <TableRowMaturityPool
                  key={maturity}
                  type={type}
                  amount={principal}
                  maturityDate={maturity}
                  symbol={symbol}
                  market={market}
                  decimals={decimals}
                />
              ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default MaturityPoolDashboardTable;
