import React from 'react';
import { Collapse, Skeleton, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { MaturityPoolTransaction } from 'types/MaturityPoolTransaction';

type Props = {
  open: boolean;
  transactions: MaturityPoolTransaction[];
};

const headers: {
  label: string;
  align: 'left' | 'center' | 'right';
}[] = [
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
];

function CollapseMaturityPool({ open, transactions }: Props) {
  return (
    <Collapse in={open} timeout="auto" unmountOnExit>
      <Table size="small" aria-label="purchases">
        <TableHead sx={{ backgroundColor: '#ebebeb' }}>
          <TableRow>
            {headers.map(({ label, align }) => (
              <TableCell key={`collapse_maturity_header_${label}`} align={align}>
                <Typography variant="subtitle2" sx={{ color: 'grey.600' }} fontWeight={600}>
                  {label}
                </Typography>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions?.map(({ id, date, type, amount, amountUSD, isBorrowOrDeposit }) => (
            <TableRow key={`collapsed_${id}`} sx={{ '&:last-child td, &:last-child th': { border: 0 } }} hover>
              <TableCell component="th" align="left" size="small">
                <Typography variant="body2">{date || <Skeleton sx={{ margin: 'auto' }} width={40} />}</Typography>
              </TableCell>
              <TableCell align="center" size="small">
                <Typography variant="body2">
                  {(
                    <>
                      <span style={isBorrowOrDeposit ? { color: `var(--success)` } : { color: `var(--error)` }}>
                        {isBorrowOrDeposit ? '↓' : '↑'}
                      </span>
                      <span style={{ paddingLeft: '2px' }}>{type}</span>
                    </>
                  ) || <Skeleton sx={{ margin: 'auto' }} width={40} />}
                </Typography>
              </TableCell>
              <TableCell align="right" size="small">
                <Typography variant="body2">
                  {(
                    <>
                      {amount}
                      <span style={{ fontSize: '0.9em', color: 'grey', paddingLeft: '4px' }}>(${amountUSD})</span>
                    </>
                  ) || <Skeleton sx={{ margin: 'auto' }} width={40} />}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Collapse>
  );
}

export default CollapseMaturityPool;
