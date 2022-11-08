import React, { FC, useContext } from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { Skeleton, Tooltip } from '@mui/material';

import Image from 'next/image';

import { toPercentage } from 'utils/utils';
import parseTimestamp from 'utils/parseTimestamp';
import formatSymbol from 'utils/formatSymbol';

import Link from 'next/link';

import numbers from 'config/numbers.json';

import { MarketContext } from 'contexts/MarketContext';
import ModalStatusContext, { Operation } from 'contexts/ModalStatusContext';
import AccountDataContext from 'contexts/AccountDataContext';
import { useWeb3Context } from 'contexts/Web3Context';

const { minAPRValue } = numbers;

export type PoolTableProps = {
  isLoading: boolean;
  headers: TableHead[];
  rows: TableRow[];
  rateType: 'floating' | 'fixed';
};

export type TableHead = {
  title: string;
  tooltipTitle?: string;
};

export type TableRow = {
  symbol: string;
  totalDeposited?: string;
  totalBorrowed?: string;
  depositAPR?: number;
  depositTimestamp?: number;
  borrowAPR?: number;
  borrowTimestamp?: number;
};

const HeadCell: FC<TableHead> = ({ title, tooltipTitle }) => {
  return (
    <TableCell align={title === 'Asset' ? 'left' : 'center'}>
      <Tooltip title={tooltipTitle} placement="top" arrow>
        <Typography variant="subtitle2" sx={{ color: 'grey.500' }} fontWeight={600}>
          {title}
        </Typography>
      </Tooltip>
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

const PoolTable: FC<PoolTableProps> = ({ isLoading, headers, rows, rateType }) => {
  const { walletAddress, connect } = useWeb3Context();
  const { accountData } = useContext(AccountDataContext);
  const { setDate, setMarket } = useContext(MarketContext);
  const { setOpen, setOperation } = useContext(ModalStatusContext);
  const tempRows = isLoading ? defaultRows : rows; // HACK this with the timeout in "marketsTables" is to avoid a screen flash when MUI  recive the new data of rows

  const handleActionClick = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    action: 'borrow' | 'deposit' | 'depositAtMaturity' | 'borrowAtMaturity',
    symbol: string,
    maturity: any,
  ) => {
    e.preventDefault();
    if (!walletAddress && connect) return connect();

    if (!accountData) return;

    const { market } = accountData[symbol];

    setOperation(action as Operation);
    setMarket({ value: market });

    if (maturity)
      setDate({
        value: maturity.toString(),
        label: parseTimestamp(maturity),
      });

    setOpen(true);

    setOperation(action);
    setOpen(true);
  };

  const isDisable = (apr: number | undefined) => {
    if (rateType === 'floating') return false;
    if (!apr) return true;

    return apr < minAPRValue;
  };

  return (
    <TableContainer component={Paper}>
      <Table aria-label="simple table">
        <TableHead>
          <TableRow>
            {headers.map(({ title, tooltipTitle }) => (
              <HeadCell key={title.trim()} title={title} tooltipTitle={tooltipTitle} />
            ))}
            <TableCell />
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {tempRows.map(
            ({ symbol, totalDeposited, totalBorrowed, depositAPR, borrowAPR, depositTimestamp, borrowTimestamp }) => (
              <Link href={`/assets/${symbol}`} key={symbol} rel="noopener noreferrer">
                <TableRow
                  key={symbol}
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    cursor: 'pointer',
                  }}
                  hover
                >
                  <TableCell component="th" scope="row">
                    <Grid container sx={{ alignContent: 'center' }}>
                      {isLoading ? (
                        <Skeleton variant="circular" width={24} height={24} />
                      ) : (
                        <Image src={`/img/assets/${symbol}.svg`} alt={symbol} width="24" height="24" />
                      )}
                      <Typography fontWeight="600" ml={1} display="inline" alignSelf="center">
                        {isLoading ? <Skeleton width={70} /> : formatSymbol(symbol)}
                      </Typography>
                    </Grid>
                  </TableCell>
                  <TableCell align="center" sx={{ width: '200px' }}>
                    <Typography>{isLoading ? <Skeleton /> : `$${totalDeposited}`}</Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ width: '200px' }}>
                    <Typography>{isLoading ? <Skeleton /> : `$${totalBorrowed}`}</Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ width: '200px' }}>
                    {isLoading ? (
                      <Skeleton />
                    ) : (
                      <Tooltip
                        title={
                          symbol === 'wstETH'
                            ? depositTimestamp
                              ? parseTimestamp(depositTimestamp) +
                                " | The displayed APR doesn't include the Lido Staked ETH APR"
                              : "The displayed APR doesn't include the Lido Staked ETH APR"
                            : depositTimestamp
                            ? parseTimestamp(depositTimestamp)
                            : ''
                        }
                        arrow
                        placement="top"
                      >
                        <Typography>
                          {toPercentage(depositAPR && depositAPR > minAPRValue ? depositAPR : undefined)}
                        </Typography>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell align="center" sx={{ width: '200px' }}>
                    {isLoading ? (
                      <Skeleton />
                    ) : (
                      <Tooltip
                        title={
                          symbol === 'wstETH'
                            ? borrowTimestamp
                              ? parseTimestamp(borrowTimestamp) +
                                " | The displayed APR doesn't include the Lido Staked ETH APR"
                              : "The displayed APR doesn't include the Lido Staked ETH APR"
                            : borrowTimestamp
                            ? parseTimestamp(borrowTimestamp)
                            : ''
                        }
                        arrow
                        placement="top"
                      >
                        <Typography>
                          {toPercentage(borrowAPR && borrowAPR > minAPRValue ? borrowAPR : undefined)}
                        </Typography>
                      </Tooltip>
                    )}
                  </TableCell>
                  <Tooltip
                    title={isDisable(depositAPR) ? "You can't deposit at 0% rate, try depositing to another pool" : ''}
                    arrow
                    placement="top"
                    followCursor
                  >
                    <TableCell
                      align="center"
                      size="small"
                      width={50}
                      onClick={(e) => e.preventDefault()}
                      sx={{ cursor: 'default' }}
                    >
                      {isLoading ? (
                        <Skeleton variant="rectangular" width={78} height={40} />
                      ) : (
                        <Button
                          variant="contained"
                          onClick={(e) =>
                            handleActionClick(
                              e,
                              rateType === 'floating' ? 'deposit' : 'depositAtMaturity',
                              symbol,
                              depositTimestamp,
                            )
                          }
                          disabled={isDisable(depositAPR)}
                        >
                          Deposit
                        </Button>
                      )}
                    </TableCell>
                  </Tooltip>

                  <TableCell
                    align="center"
                    size="small"
                    width={50}
                    onClick={(e) => e.preventDefault()}
                    sx={{ cursor: 'default' }}
                  >
                    {isLoading ? (
                      <Skeleton variant="rectangular" width={78} height={40} />
                    ) : (
                      <Button
                        variant="outlined"
                        sx={{ backgroundColor: 'white' }}
                        onClick={(e) =>
                          handleActionClick(
                            e,
                            rateType === 'floating' ? 'borrow' : 'borrowAtMaturity',
                            symbol,
                            borrowTimestamp,
                          )
                        }
                      >
                        Borrow
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              </Link>
            ),
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PoolTable;
