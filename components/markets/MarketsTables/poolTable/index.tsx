import React, { FC } from 'react';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Link from 'next/link';

import Image from 'next/image';

import { toPercentage } from 'utils/utils';

import numbers from 'config/numbers.json';
import formatSymbol from 'utils/formatSymbol';
import { Skeleton } from '@mui/material';

const { minAPRValue } = numbers;

export type PoolTableProps = {
  headers: TableHead[];
  rows: TableRow[];
};

export type TableHead = {
  title: string;
  width?: number;
};

export type TableRow = {
  symbol: string;
  totalDeposited?: string;
  totalBorrowed?: string;
  depositAPR?: number;
  borrowAPR?: number;
};

const HeadCell: FC<TableHead> = ({ title, width }) => {
  return (
    <TableCell align="center" width={width}>
      <Typography variant="caption" textTransform="uppercase" color="black" fontWeight={600}>
        {title}
      </Typography>
    </TableCell>
  );
};

const PoolTable: FC<PoolTableProps> = ({ headers, rows }) => {
  return (
    <TableContainer component={Paper}>
      <Table aria-label="simple table">
        <TableHead>
          <TableRow>
            {headers.map(({ title, width }) => (
              <HeadCell key={title.trim()} title={title} width={width} />
            ))}
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(({ symbol, totalDeposited, totalBorrowed, depositAPR, borrowAPR }) => (
            <TableRow
              key={symbol}
              sx={{
                '&:last-child td, &:last-child th': { border: 0 },
              }}
            >
              <TableCell component="th" scope="row" sx={{}}>
                <Grid container sx={{ alignContent: 'center', width: '90px' }}>
                  <Image src={`/img/assets/${symbol}.svg`} alt={symbol} width="24" height="24" />
                  <Typography fontWeight="600" ml={1} display="inline" alignSelf="center">
                    {formatSymbol(symbol)}
                  </Typography>
                </Grid>
              </TableCell>
              <TableCell align="center">
                <Typography>{totalDeposited}</Typography>
              </TableCell>
              <TableCell align="center">
                <Typography>{totalBorrowed}</Typography>
              </TableCell>
              <TableCell align="center" sx={{ width: '90px' }}>
                {depositAPR ? (
                  <Typography>{toPercentage(depositAPR > minAPRValue ? depositAPR : undefined)}</Typography>
                ) : (
                  <Skeleton />
                )}
              </TableCell>
              <TableCell align="center" sx={{ width: '90px' }}>
                {borrowAPR ? (
                  <Typography>{toPercentage(borrowAPR > minAPRValue ? borrowAPR : undefined)}</Typography>
                ) : (
                  <Skeleton />
                )}
              </TableCell>
              <TableCell align="center">
                <Link href={`/assets/${symbol}`} rel="noopener noreferrer">
                  <Button variant="outlined" sx={{ backgroundColor: 'white' }}>
                    <Typography fontWeight={600}>Details</Typography>
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PoolTable;
