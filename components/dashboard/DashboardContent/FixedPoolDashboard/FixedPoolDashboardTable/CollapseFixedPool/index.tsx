import React from 'react';
import {
  Collapse,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { FixedPoolTransaction } from 'types/FixedPoolTransaction';
import { TableHeader } from 'types/TableHeader';

type Props = {
  open: boolean;
  transactions: FixedPoolTransaction[];
};

const headers: TableHeader[] = [
  {
    label: 'Date',
    align: 'left',
  },
  {
    label: 'Operation',
    align: 'center',
  },
  {
    label: 'Amount',
    align: 'right',
  },
  {
    label: 'APR',
    align: 'right',
  },
];

function CollapseFixedPool({ open, transactions }: Props) {
  return (
    <Collapse in={open} timeout="auto" unmountOnExit>
      <Table size="small" aria-label="purchases">
        <TableHead sx={{ backgroundColor: '#ebebeb' }}>
          <TableRow>
            {headers.map(({ label, align }) => (
              <TableCell key={`collapse_fixed_pool_header_${label}`} align={align}>
                <Typography variant="subtitle2" sx={{ color: 'grey.600' }} fontWeight={600}>
                  {label}
                </Typography>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions?.map(({ id, date, type, amount, amountUSD, isBorrowOrDeposit, APR }) => (
            <TableRow key={`collapsed_${id}`} sx={{ '&:last-child td, &:last-child th': { border: 0 } }} hover>
              <TableCell component="th" align="left" size="small">
                <Typography variant="body2">{date || <Skeleton width={70} />}</Typography>
              </TableCell>
              <TableCell align="center" size="small">
                <Typography variant="body2">
                  {type ? (
                    <>
                      <span style={isBorrowOrDeposit ? { color: `var(--success)` } : { color: `var(--error)` }}>
                        {isBorrowOrDeposit ? '↓' : '↑'}
                      </span>
                      <span style={{ paddingLeft: '2px' }}>{type}</span>
                    </>
                  ) : (
                    <Skeleton sx={{ margin: 'auto' }} width={60} />
                  )}
                </Typography>
              </TableCell>
              <TableCell align="right" size="small">
                <Typography variant="body2">
                  {amount ? (
                    <>
                      {amount}
                      <Tooltip title="Calculated with current asset price" placement="bottom-end">
                        <span style={{ fontSize: '0.9em', color: 'grey', paddingLeft: '4px' }}>(${amountUSD})</span>
                      </Tooltip>
                    </>
                  ) : (
                    <Skeleton sx={{ marginLeft: 'auto' }} width={100} />
                  )}
                </Typography>
              </TableCell>
              <TableCell align="right" size="small">
                {APR !== undefined ? `${(APR || 0).toFixed(2)} %` : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Collapse>
  );
}

export default CollapseFixedPool;
