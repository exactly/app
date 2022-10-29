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
  isLoading: boolean;
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
const defaultRows: TableRow[] = [
  { symbol: 'DAI' },
  { symbol: 'USDC' },
  { symbol: 'WETH' },
  { symbol: 'WBTC' },
  { symbol: 'wstETH' },
];

const PoolTable: FC<PoolTableProps> = ({ isLoading, headers, rows }) => {
  const tempRows = isLoading ? defaultRows : rows; // HACK this with the timeout in "marketsTables" is to avoid a screen flash when MUI  recive the new data of rows
  return (
    <TableContainer component={Paper}>
      <Table aria-label="simple table">
        <TableHead>
          <TableRow>
            {headers.map(({ title, width }) => (
              <HeadCell key={title.trim()} title={title} width={width} />
            ))}
            <TableCell width={100} />
          </TableRow>
        </TableHead>
        <TableBody>
          {tempRows.map(({ symbol, totalDeposited, totalBorrowed, depositAPR, borrowAPR }) => (
            <TableRow
              key={symbol}
              sx={{
                '&:last-child td, &:last-child th': { border: 0 },
              }}
            >
              <TableCell component="th" scope="row" sx={{}}>
                <Grid container sx={{ alignContent: 'center', width: '90px' }}>
                  {isLoading ? (
                    <Skeleton variant="circular" width={24} height={24} />
                  ) : (
                    <Image src={`/img/assets/${symbol}.svg`} alt={symbol} width="24" height="24" />
                  )}
                  <Typography fontWeight="600" ml={1} display="inline" alignSelf="center">
                    {isLoading ? <Skeleton width={50} /> : formatSymbol(symbol)}
                  </Typography>
                </Grid>
              </TableCell>
              <TableCell align="center">
                <Typography>{isLoading ? <Skeleton width={50} /> : `$${totalDeposited}`}</Typography>
              </TableCell>
              <TableCell align="center">
                <Typography>{isLoading ? <Skeleton width={50} /> : `$${totalBorrowed}`}</Typography>
              </TableCell>
              <TableCell align="center" sx={{ width: '90px' }}>
                {isLoading ? (
                  <Skeleton />
                ) : (
                  <Typography>
                    {toPercentage(depositAPR && depositAPR > minAPRValue ? depositAPR : undefined)}
                  </Typography>
                )}
              </TableCell>
              <TableCell align="center" sx={{ width: '90px' }}>
                {isLoading ? (
                  <Skeleton />
                ) : (
                  <Typography>{toPercentage(borrowAPR && borrowAPR > minAPRValue ? borrowAPR : undefined)}</Typography>
                )}
              </TableCell>
              <TableCell align="center">
                {isLoading ? (
                  <Skeleton variant="rectangular" width={80} height={36} />
                ) : (
                  <>
                    <Link href={`/assets/${symbol}`} rel="noopener noreferrer">
                      <Button variant="outlined" sx={{ backgroundColor: 'white' }}>
                        <Typography fontWeight={600}>Details</Typography>
                      </Button>
                    </Link>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PoolTable;
