import React from 'react';
import { Collapse, Skeleton, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

type Transaction = {
  id: string;
  type: string;
  date: string;
  amount: string;
  amountUSD: string;
  isBorrowOrDeposit: boolean;
};

type Props = {
  open: boolean;
  transactions: Transaction[];
};

function CollapseMaturityPool({ open, transactions }: Props) {
  return (
    <Collapse in={open} timeout="auto" unmountOnExit>
      <Table size="small" aria-label="purchases">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Operation</TableCell>
            <TableCell align="right">Amount</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions?.map(({ id, date, type, amount, amountUSD }) => (
            <TableRow key={`collapsed_${id}`} sx={{ '&:last-child td, &:last-child th': { border: 0 } }} hover>
              <TableCell component="th" align="left" size="small">
                <Typography>{<div>{date}</div> || <Skeleton sx={{ margin: 'auto' }} width={40} />}</Typography>
              </TableCell>
              <TableCell align="center" size="small">
                <Typography>{<div>{type}</div> || <Skeleton sx={{ margin: 'auto' }} width={40} />}</Typography>
              </TableCell>
              <TableCell align="center" size="small">
                <Typography>
                  {(
                    <div>
                      {amount}
                      <span>(${amountUSD})</span>
                    </div>
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
