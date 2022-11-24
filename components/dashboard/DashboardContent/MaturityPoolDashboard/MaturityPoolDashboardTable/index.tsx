import React, { useMemo } from 'react';
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
import { TableHeader } from 'types/TableHeader';
import { MaturityPool } from 'types/MaturityPool';

type Props = {
  type: 'deposit' | 'borrow';
  maturities?: MaturityPool;
};

function MaturityPoolDashboardTable({ type, maturities }: Props) {
  const headers: TableHeader[] = useMemo(() => {
    return [
      {
        label: 'Asset',
        key: 'asset',
        tooltipPlacement: 'top-start',
        align: 'left',
      },
      {
        label: type === 'deposit' ? 'Deposited Amount' : 'Debt Amount',
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
  }, [type]);

  const rows = useMemo(() => {
    if (!maturities) return [];
    return Object.keys(maturities)?.flatMap((maturity) => maturities[maturity]);
  }, [maturities]);

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
          {rows?.map(({ principal, maturity, symbol, market, decimals }) => (
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
