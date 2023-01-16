import React, { FC, useMemo } from 'react';
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
import { Box, Skeleton, Tooltip } from '@mui/material';

import Image from 'next/image';
import { useRouter } from 'next/router';

import { toPercentage } from 'utils/utils';
import parseTimestamp from 'utils/parseTimestamp';
import formatSymbol from 'utils/formatSymbol';

import Link from 'next/link';

import numbers from 'config/numbers.json';

import useAssets from 'hooks/useAssets';
import useActionButton from 'hooks/useActionButton';

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
  width?: string;
};

export type TableRow = {
  symbol: string;
  totalDeposited?: string;
  totalBorrowed?: string;
  depositAPR?: number;
  depositMaturity?: number;
  borrowAPR?: number;
  borrowMaturity?: number;
};

const HeadCell: FC<TableHead> = ({ title, tooltipTitle, width }) => {
  return (
    <TableCell align="left" sx={{ minWidth: width }}>
      <Tooltip title={tooltipTitle} placement="top" arrow>
        <Typography variant="subtitle2" sx={{ color: 'grey.500' }} fontWeight={600} width="fit-content">
          {title}
        </Typography>
      </Tooltip>
    </TableCell>
  );
};

const PoolTable: FC<PoolTableProps> = ({ isLoading, headers, rows, rateType }) => {
  const { handleActionClick, isDisable } = useActionButton();
  const assets = useAssets();
  const defaultRows = useMemo<TableRow[]>(() => assets.map((s) => ({ symbol: s })), [assets]);
  const tempRows = isLoading ? defaultRows : rows; // HACK this with the timeout in "marketsTables" is to avoid a screen flash when MUI  recive the new data of rows
  const { query } = useRouter();

  return (
    <TableContainer component={Paper}>
      <Table aria-label="simple table">
        <TableHead>
          <TableRow>
            {headers.map(({ title, tooltipTitle, width }) => (
              <HeadCell key={title.trim()} title={title} tooltipTitle={tooltipTitle} width={width} />
            ))}
            <TableCell />
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {tempRows.map(
            ({ symbol, totalDeposited, totalBorrowed, depositAPR, borrowAPR, depositMaturity, borrowMaturity }) => (
              <Link href={{ pathname: `/${symbol}`, query }} key={symbol} rel="noopener noreferrer" legacyBehavior>
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
                        <Image
                          src={`/img/assets/${symbol}.svg`}
                          alt={symbol}
                          width="24"
                          height="24"
                          style={{
                            maxWidth: '100%',
                            height: 'auto',
                          }}
                        />
                      )}
                      <Typography fontWeight="600" ml={1} display="inline" alignSelf="center">
                        {isLoading ? <Skeleton width={60} /> : formatSymbol(symbol)}
                      </Typography>
                    </Grid>
                  </TableCell>
                  <TableCell align="left" sx={{ width: '200px' }}>
                    <Typography>{isLoading ? <Skeleton width={80} /> : `$${totalDeposited}`}</Typography>
                  </TableCell>
                  <TableCell align="left" sx={{ width: '200px' }}>
                    <Typography>{isLoading ? <Skeleton width={80} /> : `$${totalBorrowed}`}</Typography>
                  </TableCell>
                  <TableCell align="left" sx={{ width: '200px', py: 1 }}>
                    {isLoading ? (
                      <Skeleton width={60} />
                    ) : (
                      <Tooltip
                        title={
                          symbol === 'wstETH'
                            ? depositMaturity
                              ? parseTimestamp(depositMaturity) +
                                " | The displayed APR doesn't include the Lido Staked ETH APR"
                              : "The displayed APR doesn't include the Lido Staked ETH APR"
                            : depositMaturity
                            ? parseTimestamp(depositMaturity)
                            : ''
                        }
                        arrow
                        placement="top"
                      >
                        <Box display="flex" flexDirection="column" width="fit-content">
                          <Typography width="fit-content">
                            {toPercentage(depositAPR && depositAPR > minAPRValue ? depositAPR : undefined)}
                          </Typography>
                          {rateType === 'fixed' && (
                            <Typography width="fit-content" variant="subtitle2" sx={{ color: 'grey.500' }}>
                              {depositMaturity ? parseTimestamp(depositMaturity, 'MMM DD YYYY') : ''}
                            </Typography>
                          )}
                        </Box>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell align="left" sx={{ width: '200px', py: 1 }}>
                    {isLoading ? (
                      <Skeleton width={60} />
                    ) : (
                      <Tooltip
                        title={
                          symbol === 'wstETH'
                            ? borrowMaturity
                              ? parseTimestamp(borrowMaturity) +
                                " | The displayed APR doesn't include the Lido Staked ETH APR"
                              : "The displayed APR doesn't include the Lido Staked ETH APR"
                            : borrowMaturity
                            ? parseTimestamp(borrowMaturity)
                            : ''
                        }
                        arrow
                        placement="top"
                      >
                        <Box display="flex" flexDirection="column" width="fit-content">
                          <Typography width="fit-content">
                            {toPercentage(borrowAPR && borrowAPR > minAPRValue ? borrowAPR : undefined)}
                          </Typography>
                          {rateType === 'fixed' && (
                            <Typography width="fit-content" variant="subtitle2" sx={{ color: 'grey.500' }}>
                              {borrowMaturity ? parseTimestamp(borrowMaturity, 'MMM DD YYYY') : ''}
                            </Typography>
                          )}
                        </Box>
                      </Tooltip>
                    )}
                  </TableCell>
                  <Tooltip
                    title={
                      rateType === 'fixed' &&
                      'In order to deposit at a fixed rate, there must have been fixed rate loans at the same maturity previously to ensure the solvency condition'
                    }
                    arrow
                    placement="top"
                  >
                    <TableCell
                      align="left"
                      size="small"
                      width={50}
                      onClick={(e) => e.preventDefault()}
                      sx={{ cursor: 'default', px: 0.5 }}
                    >
                      {isLoading ? (
                        <Skeleton
                          sx={{ margin: 'auto', borderRadius: '32px' }}
                          variant="rounded"
                          height={34}
                          width={80}
                        />
                      ) : (
                        <Button
                          variant="contained"
                          onClick={(e) =>
                            handleActionClick(
                              e,
                              rateType === 'floating' ? 'deposit' : 'depositAtMaturity',
                              symbol,
                              depositMaturity,
                            )
                          }
                          disabled={isDisable(rateType, depositAPR)}
                        >
                          Deposit
                        </Button>
                      )}
                    </TableCell>
                  </Tooltip>

                  <TableCell
                    align="left"
                    size="small"
                    width={50}
                    onClick={(e) => e.preventDefault()}
                    sx={{ cursor: 'default', px: 0.5 }}
                  >
                    {isLoading ? (
                      <Skeleton
                        sx={{ margin: 'auto', borderRadius: '32px' }}
                        variant="rounded"
                        height={34}
                        width={80}
                      />
                    ) : (
                      <Tooltip
                        title="In order to borrow you need to have a deposit in the Variable Rate Pool marked as collateral in your Dashboard"
                        arrow
                        placement="top"
                      >
                        <Button
                          variant="outlined"
                          sx={{ backgroundColor: 'white' }}
                          onClick={(e) =>
                            handleActionClick(
                              e,
                              rateType === 'floating' ? 'borrow' : 'borrowAtMaturity',
                              symbol,
                              borrowMaturity,
                            )
                          }
                        >
                          Borrow
                        </Button>
                      </Tooltip>
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
