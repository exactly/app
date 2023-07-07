import React, { FC, useMemo } from 'react';
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

import { toPercentage } from 'utils/utils';
import parseTimestamp from 'utils/parseTimestamp';
import formatSymbol from 'utils/formatSymbol';

import Link from 'next/link';

import numbers from 'config/numbers.json';

import useAssets from 'hooks/useAssets';
import useActionButton from 'hooks/useActionButton';
import useSorting from 'hooks/useSorting';
import TableHeadCell, { TableHeader } from 'components/common/TableHeadCell';
import getLiquidTokenInfo from 'utils/getLiquidTokenInfo';
import useRewards from 'hooks/useRewards';
import RewardPill from 'components/markets/RewardPill';
import useRouter from 'hooks/useRouter';
import { useTranslation } from 'react-i18next';

const { minAPRValue } = numbers;

export type PoolTableProps = {
  isLoading: boolean;
  headers: TableHeader<TableRow>[];
  rows: TableRow[];
  rateType: 'floating' | 'fixed';
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

const PoolTable: FC<PoolTableProps> = ({ isLoading, headers, rows, rateType }) => {
  const { t } = useTranslation();
  const { query } = useRouter();
  const { handleActionClick, isDisable } = useActionButton();
  const assets = useAssets();
  const { rates } = useRewards();
  const defaultRows = useMemo<TableRow[]>(() => assets.map((s) => ({ symbol: s })), [assets]);
  const { setOrderBy, sortData, direction: sortDirection, isActive: sortActive } = useSorting<TableRow>();
  const tempRows = isLoading ? defaultRows : rows;

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            {headers.map(({ title, tooltipTitle, width, sortKey }) => (
              <TableHeadCell
                key={title.trim()}
                title={title}
                tooltipTitle={tooltipTitle}
                width={width}
                sortActive={sortKey && sortActive(sortKey)}
                sortDirection={sortKey && sortDirection(sortKey)}
                sort={() => setOrderBy(sortKey)}
                isSortEnabled={!!sortKey}
              />
            ))}
            <TableCell />
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {sortData(tempRows).map(
            ({ symbol, totalDeposited, totalBorrowed, depositAPR, borrowAPR, depositMaturity, borrowMaturity }) => (
              <Link href={{ pathname: `/${symbol}`, query }} key={symbol} rel="noopener noreferrer" legacyBehavior>
                <TableRow
                  key={symbol}
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    cursor: 'pointer',
                  }}
                  hover
                  data-testid={`markets-${rateType}-pool-row-${symbol}`}
                >
                  <TableCell component="th" scope="row">
                    <Grid container alignItems="center">
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
                      <Typography fontWeight="600" ml={1}>
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
                    {isLoading || depositAPR === undefined ? (
                      <Skeleton width={80} />
                    ) : (
                      <Tooltip title={getLiquidTokenInfo(symbol)} arrow placement="top">
                        <Box display="flex" flexDirection="column" width="fit-content">
                          <Grid container alignItems="center" gap={1}>
                            <Typography minWidth={40} lineHeight={1}>
                              {toPercentage(depositAPR > minAPRValue ? depositAPR : undefined)}
                            </Typography>
                            {rateType !== 'fixed'
                              ? rates[symbol]?.map((r) => (
                                  <RewardPill key={r.asset} rate={r.floatingDeposit} symbol={r.assetSymbol} />
                                ))
                              : null}
                          </Grid>
                          {rateType === 'fixed' && (
                            <Typography width="fit-content" variant="subtitle2" color="grey.500">
                              {depositMaturity ? parseTimestamp(depositMaturity) : ''}
                            </Typography>
                          )}
                        </Box>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell align="left" sx={{ width: '200px', py: 1 }}>
                    {isLoading || borrowAPR === undefined ? (
                      <Skeleton width={80} />
                    ) : (
                      <Tooltip title={getLiquidTokenInfo(symbol)} arrow placement="top">
                        <Box display="flex" flexDirection="column" width="fit-content">
                          <Grid container alignItems="center" gap={1}>
                            <Typography minWidth={40}>
                              {toPercentage(borrowAPR > minAPRValue ? borrowAPR : undefined)}
                            </Typography>
                            {rates[symbol]?.map((r) => (
                              <RewardPill key={r.asset} rate={r.borrow} symbol={r.assetSymbol} />
                            ))}
                          </Grid>
                          {rateType === 'fixed' && (
                            <Typography width="fit-content" variant="subtitle2" color="grey.500">
                              {borrowMaturity ? parseTimestamp(borrowMaturity) : ''}
                            </Typography>
                          )}
                        </Box>
                      </Tooltip>
                    )}
                  </TableCell>
                  <Tooltip
                    title={
                      rateType === 'fixed' &&
                      t(
                        'In order to deposit at a fixed rate, there must have been fixed rate loans at the same maturity previously to ensure the solvency condition',
                      )
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
                          data-testid={`${rateType}-deposit-${symbol}`}
                          sx={{ whiteSpace: 'nowrap' }}
                        >
                          {t('Deposit')}
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
                        title={t(
                          'In order to borrow you need to have a deposit in the Variable Rate Pool marked as collateral in your Dashboard',
                        )}
                        arrow
                        placement="top"
                      >
                        <Button
                          variant="outlined"
                          sx={{ backgroundColor: 'components.bg', whiteSpace: 'nowrap' }}
                          onClick={(e) =>
                            handleActionClick(
                              e,
                              rateType === 'floating' ? 'borrow' : 'borrowAtMaturity',
                              symbol,
                              borrowMaturity,
                            )
                          }
                          data-testid={`${rateType}-borrow-${symbol}`}
                        >
                          {t('Borrow')}
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
